// FFd20 registers a factory proxy on documentClass. Resolve the actual method
// owner so subtype overrides can still call super and chained wrappers run once.
export function methodOwner(config,type,method){
 const concrete=config.documentClasses?.[type]??config.documentClass;
 for(let p=concrete?.prototype;p;p=Object.getPrototypeOf(p))
  if(typeof Object.getOwnPropertyDescriptor(p,method)?.value==="function")return p;
 throw new Error("FF D20 Expanded Bestiary: missing "+type+"."+method);
}
