import Operator from './Operator'
import Scope from './Scope'
import { Fn, } from './Function'
import { LnParser, } from '../ln'

// Only implements the pieces necessary for the first stage compiler
class Statement {
  statementOrAssignableAst: any // TODO: Migrate off ANTLR for better typing here
  scope: Scope
  pure: boolean

  constructor(statementOrAssignableAst: any, scope: Scope, pure: boolean) {
    this.statementOrAssignableAst = statementOrAssignableAst,
    this.scope = scope
    this.pure = pure
  }

  isConditionalStatement() {
    return this.statementOrAssignableAst instanceof LnParser.StatementsContext &&
      this.statementOrAssignableAst.conditionals() !== null
  }

  isReturnStatement() {
    return this.statementOrAssignableAst instanceof LnParser.AssignablesContext ||
      this.statementOrAssignableAst.exits() !== null
  }

  static basicAssignableHasObjectLiteral(basicAssignableAst: any) { // TODO: Remove ANTLR
    if (basicAssignableAst.objectliterals()) return true
    return false
  }

  static assignablesHasObjectLiteral(assignablesAst: any) { // TODO: Remove ANTLR
    const a = assignablesAst
    if (a.basicassignables()) return Statement.basicAssignableHasObjectLiteral(
      a.basicassignables()
    )
    return a.withoperators().operatororassignable()
      .filter((oa: any) => !!oa.basicassignables())
      .some((oa: any) => Statement.basicAssignableHasObjectLiteral(oa.basicassignables()))
  }

  static assignmentsHasObjectLiteral(assignmentsAst: any) { // TODO: Remove ANTLR
    return Statement.assignablesHasObjectLiteral(assignmentsAst.assignables())
  }

  hasObjectLiteral() {
    if (this.statementOrAssignableAst instanceof LnParser.StatementsContext) {
      const s = this.statementOrAssignableAst
      if (s.declarations()) {
        const d = s.declarations().constdeclaration() || s.declarations().letdeclaration()
        if (d.assignments().assignables()) {
          return Statement.assignmentsHasObjectLiteral(d.assignments())
        }
      }
      if (s.assignments()) return Statement.assignmentsHasObjectLiteral(s.assignments())
      if (s.calls() && s.calls().assignables() > 0) s.calls().assignables().some(
        (a: any) => Statement.assignablesHasObjectLiteral(a)
      )
      if (s.exits() && s.exits().assignables()) return Statement.assignablesHasObjectLiteral(
        s.exits().assignables()
      )
      if (s.emits() && s.emits().assignables()) return Statement.assignablesHasObjectLiteral(
        s.emits().assignables()
      )
      // TODO: Cover conditionals
      return false
    } else {
      return Statement.assignablesHasObjectLiteral(this.statementOrAssignableAst)
    }
  }

  static isCallPure(callAst: any, scope: Scope) { // TODO: Migrate off ANTLR
    // TODO: Add purity checking for chained method-style calls
    const fn = scope.deepGet(callAst.varn(0).getText()) as Array<Fn>
    if (!fn) {
      // TODO: This function may be defined in the execution scope, we won't know until runtime
      // right now, but it should be determinable at "compile time". Need to fix this to check
      // if prior statements defined it, for now, just assume it exists and is not pure
      return false
    }
    if (!(fn instanceof Array && fn[0].microstatementInlining instanceof Function)) {
      throw new Error(callAst.varn(0).getText() + " is not a function")
    }
    // TODO: Add all of the logic to determine which function to use in here, too. For now,
    // let's just assume they all have the same purity state, which is a terrible assumption, but
    // easier.
    if (!fn[0].isPure()) return false
    const assignableListAst = callAst.fncall(0).assignablelist()
    if (assignableListAst == null) { // No arguments to this function call
      return true
    }
    for (const assignable of assignableListAst.assignables()) {
      if (Statement.isAssignablePure(assignable, scope) === false) return false
    }
    return true
  }

  static isWithOperatorsPure(withOperatorsAst: any, scope: Scope) { // TODO: Migrate off ANTLR
    for (const operatorOrAssignable of withOperatorsAst.operatororassignable()) {
      if (operatorOrAssignable.operators() != null) {
        const operator = operatorOrAssignable.operators()
        const op = scope.deepGet(operator.getText()) as Array<Operator>
        if (!op || !(op instanceof Array && op[0] instanceof Operator)) {
          throw new Error("Operator " + operator.getText() + " is not defined")
        }
        // TODO: Similar to the above, need to figure out logic to determine which particular function
        // will be the one called. For now, just assume the first one and fix this later.
        if (!op[0].potentialFunctions[0].isPure()) return false
      }
      if (operatorOrAssignable.basicassignables() != null) {
        if (!Statement.isBasicAssignablePure(operatorOrAssignable.basicassignables(), scope)) {
          return false
        }
      }
    }

    return true
  }

  static isBasicAssignablePure(basicAssignable: any, scope: Scope) { // TODO: Migrate off ANTLR
    if (basicAssignable.functions() != null) {
      // Defining a function in itself is a pure situation
      return true
    }
    if (basicAssignable.calls() != null) {
      return Statement.isCallPure(basicAssignable.calls(), scope)
    }
    if (basicAssignable.varn() != null) {
      // This would be a read-only operation to pull a value into local scope
      return true
    }
    if (basicAssignable.constants() != null) {
      // This is an explicit constant that cannot impact any outer scope
      return true
    }
    if (basicAssignable.groups() != null) {
      // This is a "group" (parens surrounding one or more operators and operands)
      return Statement.isWithOperatorsPure(basicAssignable.groups().withoperators(), scope)
    }
    // Shouldn't be reached
    return false
  }

  static isAssignablePure(assignableAst: any, scope: Scope) { // TODO: Migrate off ANTLR
    if (assignableAst.basicassignables() != null) {
      return Statement.isBasicAssignablePure(assignableAst.basicassignables(), scope)
    }
    if (assignableAst.withoperators() != null) {
      return Statement.isWithOperatorsPure(assignableAst.withoperators(), scope)
    }
    // This should never be reached
    throw new Error("Impossible assignment situation")
  }

  static create(statementOrAssignableAst: any, scope: Scope) { // TODO: Migrate off ANTLR
    if (statementOrAssignableAst instanceof LnParser.AssignablesContext) {
      const pure = Statement.isAssignablePure(statementOrAssignableAst, scope)
      return new Statement(statementOrAssignableAst, scope, pure)
    } else if (statementOrAssignableAst instanceof LnParser.StatementsContext) {
      const statementAst = statementOrAssignableAst
      let pure = true
      if (statementAst.declarations() != null) {
        if (statementAst.declarations().constdeclaration() != null) {
          pure = Statement.isAssignablePure(
            statementAst.declarations().constdeclaration().assignments().assignables(),
            scope
          )
        } else if (statementAst.declarations().letdeclaration() != null) {
          if (statementAst.declarations().letdeclaration().assignments() != null) {
            if (statementAst.declarations().letdeclaration().assignments().assignables() == null) {
              pure = true
            } else {
              pure = Statement.isAssignablePure(
                statementAst.declarations().letdeclaration().assignments().assignables(),
                scope
              )
            }
          }
        } else {
          throw new Error("Bad assignment somehow reached")
        }
      }
      if (statementAst.assignments() != null) {
        if (statementAst.assignments().assignables() != null) {
          pure = Statement.isAssignablePure(statementAst.assignments().assignables(), scope)
        }
      }
      if (statementAst.calls() != null) {
        pure = Statement.isCallPure(statementAst.calls(), scope)
      }
      if (statementAst.exits() != null) {
        if (statementAst.exits().assignables() != null) {
          pure = Statement.isAssignablePure(statementAst.exits().assignables(), scope)
        }
      }
      if (statementAst.emits() != null) {
        if (statementAst.emits().assignables() != null) {
          pure = Statement.isAssignablePure(statementAst.emits().assignables(), scope)
        }
      }
      return new Statement(statementAst, scope, pure)
    } else {
      // What?
      throw new Error("This should not be possible")
    }
  }

  toString() {
    return this.statementOrAssignableAst.getText()
  }
}

export default Statement
