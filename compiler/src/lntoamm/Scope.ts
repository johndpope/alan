import Box from './Box'
import Type from './Type'
import { LnParser, } from '../ln'

class Scope {
  vals: object
  par: Scope | null

  constructor(par?: Scope) {
    this.vals = {}
    this.par = par ? par : null
  }

  get(name: string) {
    if (this.vals.hasOwnProperty(name)) {
      return this.vals[name]
    }
    if (this.par != null) {
      return this.par.get(name)
    }
    return null
  }

  deepGet(fullName: string) {
    const fullVar = fullName.trim().split(".")
    let boxedVar: any
    for (let i = 0; i < fullVar.length; i++) {
      if (i === 0) {
        boxedVar = this.get(fullVar[i])
      } else if (boxedVar === null) {
        return null
      } else {
        if (boxedVar.type === Type.builtinTypes['scope']) {
          boxedVar = boxedVar.scopeval.get(fullVar[i])
        } else if (boxedVar.typevalval !== null) {
          boxedVar = boxedVar.typevalval[fullVar[i]]
        } else {
          return null
        }
      }
    }
    return boxedVar
  }

  has(name: string) {
    if (this.vals.hasOwnProperty(name)) {
      return true
    }
    if (this.par != null) {
      return this.par.has(name)
    }
    return false
  }

  put(name: string, val: Box) {
    this.vals[name.trim()] = val
  }

  deepPut(fullName: string, val: any) {
    const fullVar = fullName.split(".")
    let almostFullVar = fullVar[0];
    for (let i = 1; i < fullVar.length - 1; i++) {
      almostFullVar += "." + fullVar[i];
    }
    let boxedVar = this.deepGet(almostFullVar)
    if (boxedVar !== null) {
      if (boxedVar.typevalval === null) {
        boxedVar = null // Just reset and continue with the for loop
      } else {
        boxedVar.typevalval[fullVar[fullVar.length - 1]] = val
        return
      }
    }
    for (let i = 0; i < fullVar.length; i++) {
      if (boxedVar === null) {
        boxedVar = this.deepGet(fullVar[i])
      } else {
        if (boxedVar.type === Type.builtinTypes["scope"]) {
          boxedVar = boxedVar.scopeval.get(fullVar[i])
        } else if (boxedVar.typevalval !== null) { // User-defined type instance
          boxedVar = boxedVar.typevalval[fullVar[i]]
        } else { // This should be a terminal value so an extra "." makes no sense
          console.error("Attempted to export non-existent value: " + fullName)
          process.exit(-26)
        }
      }
    }
    if (boxedVar.type === Type.builtinTypes["scope"]) {
      boxedVar.scopeval.put(fullVar[fullVar.length - 1], val)
    } else if (boxedVar.typevalval != null) {
      boxedVar.typevalval[fullVar[fullVar.length - 1]] = val
    } else if (boxedVar.type.typename === "void") {
      // We're cool, this is throwing away some value
      return
    } else if (boxedVar.readonly === false && boxedVar.type === val.type) {
      // We're reassigning a variable with the same time
      // TODO: When we add ADTs, need to make the type check more advanced
      // Also TODO: Make the following algorithm less dumb and slow.
      let boxedScope: Scope = this
      while (!Object.values(boxedScope.vals).includes(boxedVar)) {
        // We've already proven that we can find this value in the scope hierarchy, so this *will*
        // halt. :)
        boxedScope = boxedScope.par
      }
      // Replace that value with the new one. This *should* work without having to scan the keys
      boxedScope.put(fullVar[fullVar.length - 1], val)
    } else {
      console.error("Attempted to set a value on a non-scope, non-compound-type value")
      process.exit(-27)
    }
  }
}

export default Scope