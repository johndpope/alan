import {
  And,
  CharSet,
  NamedAnd,
  NamedOr,
  Not,
  NulLP,
  OneOrMore,
  Or,
  Token,
  ZeroOrMore,
  ZeroOrOne,
} from '../lp'

// Defining LN Tokens
const space = Token.build(' ')
const blank = OneOrMore.build(space)
const optblank = ZeroOrOne.build(blank)
const newline = Token.build('\n')
const optnewline = ZeroOrMore.build(newline)
const singlelinecomment = And.build([
  Token.build('//'),
  ZeroOrMore.build(Not.build('\n')),
  newline,
])
const multilinecomment = And.build([
  Token.build('/*'),
  ZeroOrMore.build(Or.build([
    Not.build('*'),
    Not.build('*/'),
  ])),
  Token.build('*/'),
])
const whitespace = OneOrMore.build(Or.build([space, newline, singlelinecomment, multilinecomment]))
const optwhitespace = ZeroOrOne.build(whitespace)
const colon = Token.build(':')
const under = Token.build('_')
const negate = Token.build('-')
const dot = Token.build('.')
const equals = Token.build('=')
const openParen = Token.build('(')
const closeParen = Token.build(')')
const openCurly = Token.build('{')
const closeCurly = Token.build('}')
const openCaret = Token.build('<')
const closeCaret = Token.build('>')
const openBracket = Token.build('[')
const closeBracket = Token.build(']')
const comma = Token.build(',')
const optcomma = ZeroOrOne.build(comma)
const base10 = CharSet.build('0', '9')
const natural = OneOrMore.build(base10)
const integer = And.build([ZeroOrOne.build(negate), natural])
const real = And.build([integer, ZeroOrOne.build(And.build([dot, natural]))])
const lower = CharSet.build('a', 'z')
const upper = CharSet.build('A', 'Z')
const variable = And.build([
  OneOrMore.build(Or.build([under, lower, upper])),
  ZeroOrMore.build(Or.build([under, lower, upper, natural])),
])
const operatorsymbols = Or.build(
  '+\-/*^.~`!@#$%&|:;<>?='.split('').map(Token.build.bind(Token))
)
const operator = OneOrMore.build(operatorsymbols)
const importt = Token.build('import')
const asa = Token.build('as')
const curdir = Token.build('./')
const pardir = Token.build('../')
const dirsep = Token.build('/')
const global = Token.build('@')
const fromm = Token.build('from')
const typee = Token.build('type')
const exit = Token.build('return')
const t = Token.build('true')
const f = Token.build('false')
const bool = Or.build([t, f])
const emit = Token.build('emit')
const letn = Token.build('let')
const constn = Token.build('const')
const on = Token.build('on')
const event = Token.build('event')
const fn = Token.build('fn')
const iff = Token.build('if')
const elsee = Token.build('else')
const prefix = Token.build('prefix')
const infix = Token.build('infix')
const precedence = Token.build('precedence')
const interfacee = Token.build('interface')
const exportt = Token.build('export')
const neww = Token.build('new')
const quote = Token.build('"')
const escapeQuote = Token.build('\\"')
const notQuote = Not.build('"')
const squote = Token.build('\'')
const escapeSQuote = Token.build('\\\'')
const notSQuote = Not.build('\'')
const str = Or.build([
  And.build([quote, ZeroOrMore.build(Or.build([escapeQuote, notQuote])), quote]),
  And.build([squote, ZeroOrMore.build(Or.build([escapeSQuote, notSQuote])), squote]),
])
const constants = NamedOr.build({ str, bool, real, integer, })
const varop = Or.build([variable, operator])
const renameablevar = And.build([
  varop,
  ZeroOrOne.build(And.build([
    whitespace,
    asa,
    whitespace,
    varop,
  ])),
])
const varlist = And.build([
  renameablevar,
  ZeroOrMore.build(And.build([
    comma,
    optblank,
    renameablevar,
  ])),
])

const globaldependency = And.build([
  global,
  OneOrMore.build(Or.build([
    variable,
    dirsep,
  ])),
])
const localdependency = Or.build([
  And.build([
    curdir,
    OneOrMore.build(Or.build([
      variable,
      dirsep,
    ])),
  ]),
  And.build([
    pardir,
    OneOrMore.build(Or.build([
      variable,
      dirsep,
    ])),
  ]),
])
const dependency = Or.build([localdependency, globaldependency])
const standardImport = NamedAnd.build({
  importt,
  a: whitespace,
  dependency,
  rename: ZeroOrOne.build(NamedAnd.build({
    a: whitespace,
    asa,
    b: whitespace,
    variable,
  })),
  newline,
  optblank,
})
const fromImport = NamedAnd.build({
  fromm,
  a: whitespace,
  dependency,
  b: whitespace,
  importt,
  c: whitespace,
  varlist,
  newline,
  optblank,
})
const imports = Or.build([standardImport, fromImport])

const opttypegenerics = ZeroOrOne.build(new NulLP()) // Circular dependency trick
const fulltypename = NamedAnd.build({
  variable,
  optblank,
  opttypegenerics,
})
const typegenerics = NamedAnd.build({
  openCaret,
  a: optblank,
  fulltypename,
  b: optblank,
  extragenerics: ZeroOrMore.build(NamedAnd.build({
    comma,
    a: optblank,
    fulltypename,
    b: optblank,
  })),
  closeCaret,
})
opttypegenerics.zeroOrOne = typegenerics
const typeline = NamedAnd.build({
  variable,
  a: optwhitespace,
  colon,
  b: optwhitespace,
  fulltypename,
  optnewline,
})
const typebody = NamedAnd.build({
  openCurly,
  whitespace,
  typelines: OneOrMore.build(NamedAnd.build({
    optblank,
    typeline,
  })),
  optwhitespace,
  closeCurly,
})
const types = NamedAnd.build({
  typee,
  a: blank,
  fulltypename,
  b: optblank,
  typedef: Or.build([
    typebody,
    NamedAnd.build({
      equals,
      optblank,
      fulltypename,
    }),
  ]),
})
const typeofn = NamedAnd.build({
  typee,
  optblank,
  basicassignables: new NulLP(), // Circular dependency trick
})
const operatororassignable = NamedOr.build({
  operator,
  basicassignables: new NulLP(), // Circular dependency trick
})
const withoperators = OneOrMore.build(NamedAnd.build({
  operatororassignable,
  optwhitespace,
}))
const groups = NamedAnd.build({
  openParen,
  a: optwhitespace,
  withoperators,
  b: optwhitespace,
  closeParen,
})
const arrayliteral = NamedAnd.build({
  typeinfo: ZeroOrOne.build(NamedAnd.build({
    neww,
    blank,
    fulltypename,
    optblank,
  })),
  openBracket,
  a: optwhitespace,
  optassignablelist: new NulLP(), // Circular-dep trick
  b: optwhitespace,
  closeBracket,
})
const typeliteral = NamedAnd.build({
  neww,
  blank,
  fulltypename,
  optblank,
  openCurly,
  properties: OneOrMore.build(NamedAnd.build({
    assignments: new NulLP(), // Circular-dep trick
    whitespace,
  })),
  closeCurly,
})
const mapline = NamedAnd.build({
  key: new NulLP(),
  a: optblank,
  colon,
  b: optblank,
  val: new NulLP(),
  whitespace,
})
const mapliteral = NamedAnd.build({
  neww,
  blank,
  fulltypename,
  optblank,
  openCurly,
  maplines: ZeroOrMore.build(mapline),
  closeCurly,
})
const objectliterals = NamedOr.build({
  arrayliteral,
  typeliteral,
  mapliteral,
})
const basicassignables = NamedOr.build({
  constants,
  calls: new NulLP(),
  functions: new NulLP(), // Circular-dep trick
  groups,
  typeofn, // TODO: Delete this?
  objectliterals,
  varn: new NulLP(),
})
operatororassignable.or.basicassignables = basicassignables
typeofn.and.basicassignables = basicassignables
const assignables = NamedOr.build({
  withoperators,
  basicassignables,
})
mapline.and.key = assignables
mapline.and.val = assignables
const constdeclaration = NamedAnd.build({
  constn,
  a: blank,
  variable,
  valtype: ZeroOrOne.build(NamedAnd.build({
    a: optblank,
    colon,
    b: optblank,
    fulltypename,
  })),
  b: optblank,
  equals,
  c: optblank,
  assignables,
})
const letdeclaration = NamedAnd.build({
  letn,
  a: blank,
  variable,
  valtype: ZeroOrOne.build(NamedAnd.build({
    a: optblank,
    colon,
    b: optblank,
    fulltypename,
  })),
  b: optblank,
  equals,
  c: optblank,
  assignables,
})
const declarations = Or.build([constdeclaration, letdeclaration])
const assignments = NamedAnd.build({
  variable,
  valtype: ZeroOrOne.build(NamedAnd.build({
    a: optblank,
    colon,
    b: optblank,
    fulltypename,
  })),
  b: optblank,
  equals,
  c: optblank,
  assignables,
});
((typeliteral.and.properties as OneOrMore).oneOrMore[0] as NamedAnd).and.assignments = assignments
const arg = NamedAnd.build({
  variable,
  vartype: ZeroOrOne.build(NamedAnd.build({
    a: optblank,
    colon,
    b: optblank,
    fulltypename,
  })),
})
const args = NamedAnd.build({
  firstArg: arg,
  nextArgs: ZeroOrMore.build(NamedAnd.build({
    a: optwhitespace,
    comma,
    b: optwhitespace,
    arg,
  })),
})
const arrayaccess = NamedAnd.build({
  openBracket,
  a: optblank,
  assignables,
  b: optblank,
  closeBracket,
})
const varsegment = Or.build([variable, dot, arrayaccess])
const varn = OneOrMore.build(varsegment)
basicassignables.or.varn = varn
const callable = NamedOr.build({
  varn,
  constants,
  groups,
})
const assignablelist = NamedAnd.build({
  a: optwhitespace,
  assignables,
  b: optwhitespace,
  others: ZeroOrMore.build(NamedAnd.build({
    comma,
    optwhitespace,
    assignables,
  })),
  optcomma,
  c: optwhitespace,
})
const optassignablelist = ZeroOrOne.build(assignablelist)
arrayliteral.and.optassignablelist = optassignablelist
const fncall = NamedAnd.build({
  openParen,
  optassignablelist,
  closeParen,
})
const calls = NamedAnd.build({
  callable,
  fncall,
  chain: ZeroOrMore.build(NamedAnd.build({
    optwhitespace,
    dot,
    callable,
    fncall,
  })),
})
basicassignables.or.calls = calls
const optvalue = ZeroOrOne.build(NamedAnd.build({
  whitespace,
  assignables,
}))
const exits = NamedAnd.build({
  exit,
  optvalue
})
const emits = NamedAnd.build({
  emit,
  whitespace,
  varn,
  optvalue,
})
const blocklike = NamedOr.build({
  functions: new NulLP(), // Circular dep trick
  functionbody: new NulLP(),
  varn,
})
const conditionals = NamedAnd.build({
  iff,
  a: optwhitespace,
  assignables,
  b: optwhitespace,
  blocklike,
  optelse: ZeroOrOne.build(NamedAnd.build({
    a: optwhitespace,
    elsee,
    b: optwhitespace,
    nested: NamedOr.build({
      conditionals: new NulLP(), // Circular dep trick
      blocklike,
    }),
  })),
});
(((conditionals.and.optelse as ZeroOrOne).zeroOrOne as NamedAnd).and.nested as NamedOr).or.conditionals = conditionals
const statement = NamedAnd.build({
  statement: NamedOr.build({
    declarations,
    assignments,
    calls,
    exits,
    emits,
    conditionals,
  }),
  optwhitespace,
})
const functionbody = NamedAnd.build({
  openCurly,
  a: optwhitespace,
  statements: OneOrMore.build(statement),
  b: optwhitespace,
  closeCurly,
})
const functiononeliner = NamedAnd.build({
  equals,
  whitespace,
  assignables,
})
const fullfunctionbody = Or.build([functionbody, functiononeliner])
const functions = NamedAnd.build({
  fn,
  whitespace,
  name: ZeroOrOne.build(variable),
  a: optblank,
  openParen,
  args: ZeroOrOne.build(args),
  closeParen,
  rettype: ZeroOrOne.build(NamedAnd.build({
    a: optblank,
    colon,
    b: optblank,
    fulltypename,
  })),
  b: optwhitespace,
  fullfunctionbody,
})
blocklike.or.functions = functions
blocklike.or.functionbody = functionbody
basicassignables.or.functions = functions
const fntoop = NamedAnd.build({
  varn,
  a: blank,
  asa,
  b: blank,
  operator,
})
const opprecedence = NamedAnd.build({
  precedence,
  blank,
  integer,
})
const prefixop = NamedAnd.build({
  prefix,
  blank,
  opdef: Or.build([
    NamedAnd.build({
      fntoop,
      blank,
      opprecedence,
    }),
    NamedAnd.build({
      opprecedence,
      blank,
      fntoop,
    }),
  ]),
})
const infixop = NamedAnd.build({
  infix,
  blank,
  opdef: Or.build([
    NamedAnd.build({
      fntoop,
      blank,
      opprecedence,
    }),
    NamedAnd.build({
      opprecedence,
      blank,
      fntoop,
    }),
  ]),
})
const operatormapping = NamedOr.build({
  prefixop,
  infixop,
})
const events = NamedAnd.build({
  event,
  whitespace,
  variable,
  a: optwhitespace,
  colon,
  b: optwhitespace,
  varn,
})
const eventref = NamedOr.build({
  variable,
  varn,
  calls,
})
const handler = NamedOr.build({
  functions,
  varn,
  functionbody,
})
const handlers = NamedAnd.build({
  on,
  a: whitespace,
  eventref,
  b: whitespace,
  handler,
})
const functiontype = NamedAnd.build({
  openParen,
  args: ZeroOrOne.build(args),
  closeParen,
  a: optwhitespace,
  colon,
  b: optwhitespace,
  varn,
})
const functiontypeline = NamedAnd.build({
  nameoranonymous: NamedOr.build({
    variable,
    fn,
  }),
  optblank,
  functiontype,
})
const operatortypeline = NamedAnd.build({
  optleftarg: ZeroOrOne.build(NamedAnd.build({
    varn,
    optwhitespace,
  })),
  operator,
  a: optwhitespace,
  rightarg: varn,
  b: optwhitespace,
  colon,
  c: optwhitespace,
  restype: varn,
})
const propertytypeline = NamedAnd.build({
  variable,
  a: optblank,
  colon,
  b: optblank,
  fulltypename,
})
const interfaceline = NamedOr.build({
  functiontypeline,
  operatortypeline,
  propertytypeline,
  whitespace,
})
const interfacebody = NamedAnd.build({
  openCurly,
  optwhitespace,
  interfacelines: ZeroOrMore.build(interfaceline),
  closeCurly,
})
const interfacealias = NamedAnd.build({
  equals,
  optblank,
  fulltypename,
})
const interfacedef = NamedOr.build({
  interfacebody,
  interfacealias,
})
const interfaces = NamedAnd.build({
  interfacee,
  a: optblank,
  variable,
  b: optblank,
  interfacedef,
})
const exportts = NamedAnd.build({
  exportt,
  whitespace,
  exported: NamedOr.build({
    types,
    constdeclaration,
    functions,
    operatormapping,
    events,
    interfaces,
    varn,
  }),
})

const ln = NamedAnd.build({
  a: optwhitespace,
  imports: ZeroOrMore.build(imports),
  body: ZeroOrMore.build(NamedOr.build({
    whitespace,
    types,
    constdeclaration,
    functions,
    operatormapping,
    events,
    handlers,
    interfaces,
    exportts,
  })),
})
export default ln
