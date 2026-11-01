export {};
/*
export const openapi = (data: ZodObject<any>[], file: string, name: string, options: {}) => {
    const registry = new OpenAPIRegistry()
    data.forEach((s) => registry.register(s.description, s))
    const generator = new OpenApiGeneratorV3(registry.definitions)
    const component = generator.generateComponents()
    // const content = stringifyYAML(component)
    return component
}
*/
/*
const yaml = (data: ZodObject<any>[], file: string, name: string, options: {}) => {
    const registry = new OpenAPIRegistry()
    data.forEach((s) => registry.register(s.description, s))
    const generator = new OpenApiGeneratorV3(registry.definitions)
    const component = generator.generateComponents()
    logger.debug(`Writing schema to ${file} : ${name}`,component)
    writeFS(file,stringifyYAML(component))
}
*/ 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbmFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2hlbWFzL29wZW5hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7RUFTRTtBQUNGOzs7Ozs7Ozs7RUFTRSJ9