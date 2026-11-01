const  example =  {
    "Injection / Inyección": [
        "servicios de inyecciones de plastico",
        "servicios de inyecciones prototipos funcionales",
        "inyección plastico prototipos funcionales",
        "servicio de prototipo con plástico",
        "FABRICANTES DE PIEZAS DE PLÁSTICO POR INYECCIÓN",
        "proveedores de plastico para inyección",
        "piezas de plástico por inyección",
        "piezas de plástico a medida",
        "servicio de diseño para inyección de plastico"
    ],
    "Extrusion": [
        "servicio de extrusion de plastico",
        "prototipos para extrusion de plastico",
        "produccion por extrusión de plástico",
        "asesoramiento en extrusión de plástico",
        "servicio de diseño para extrusion de plastico",
        "estudio de diseño de producto e ingeniería"
    ],
    "Education / Educación": [
        "formación Grado en Tecnologías Industriales en presencial",
        "centros educativos de actividades extraescolares tecnologicas",
        "Clubes extraescolares de secundaria",
        "talleres extraescolares en colegios",
        "centros de formación en tecnología industrial en presencial",
        "centros de formación en arquitectura en presencial",
        "formación en diseño industrial",
        "Formación en Arquitectura Ingeniería y Diseño"
    ]
}

export const flattenObject = (obj: any) => {
    
    const result: any[] = []
    
    const flatten = (obj: any, prefix: string = '') => 
    {
        for (const key in obj) 
        {
            if (typeof obj[key] === 'object') {
                flatten(obj[key], `${prefix}${key}`)
            } else {
                result.push(
                    {
                        category : prefix,
                        term: obj[key]
                    }
                )
            }
        }
    }

    flatten(obj)
    return result
}
