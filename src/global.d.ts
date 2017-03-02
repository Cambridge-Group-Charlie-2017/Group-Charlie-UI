/*
 * Some modules we use does not provide typescript definitions,
 * so we need to import them using require instead of import
 */
declare function require(name: string): any;
