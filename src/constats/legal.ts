interface LegalSection {
    heading?: string;
    text?: string;
    list?: string[];
}

interface LegalPage {
    id: string;
    label: string;
    title: string;
    sections: LegalSection[];
}

export const LEGAL_PAGES: LegalPage[] = [
    {
        id: "about",
        label: "Nosotros",
        title: "AMMAE: Tienda de Ropa Urbana Multimarca en Colombia",
        sections: [
            {
                text: "AMMAE es una tienda de ropa urbana multimarca que nace en Colombia con el propósito de conectar la cultura streetwear con las nuevas generaciones. Ofrecemos una cuidada selección de prendas que combinan diseño, autenticidad y estilo, representando tanto marcas emergentes como marcas reconocidas del mundo urbano.",
            },
            {
                heading: "Nuestra Historia",
                text: "Como startup, comenzamos este proyecto con una visión clara: convertirnos en un punto de encuentro para quienes viven la moda urbana como un estilo de vida. Desde nuestros inicios, hemos trabajado para construir una comunidad auténtica, diversa y apasionada por la cultura urbana.",
            },
            {
                heading: "Nuestra Visión",
                text: "Buscamos posicionarnos como referente en moda urbana en Colombia, ofreciendo no solo productos, sino también experiencias que inspiren a nuestros clientes a expresar quiénes son. Cada colección refleja tendencias actuales y valores culturales, respetando siempre la identidad de cada marca.",
            },
            {
                heading: "Nuestro Compromiso",
                text: "En AMMAE, priorizamos la calidad, la originalidad y el respeto por las marcas que representamos. Creemos en el poder de la moda urbana para contar historias y generar comunidad. Gracias por ser parte de esta aventura. Esto apenas comienza.",
            },
        ],
    },
    {
        id: "privacy",
        label: "Privacidad",
        title: "Política de Privacidad",
        sections: [
            {
                text: "En AMMAE respetamos su privacidad y la protección de su información personal. No venderemos ni transferiremos sus datos a terceros. Toda la información suministrada será utilizada únicamente con fines internos, como la generación de estadísticas, para comprender mejor el perfil de nuestros usuarios y así mejorar los productos y servicios ofrecidos en nuestro sitio web.",
            },
            {
                heading: "Propiedad de la Información",
                text: "Toda la información contenida en este sitio es propiedad de AMMAE. No se puede modificar, copiar, extraer o utilizar sin consentimiento previo y por escrito. Al acceder a nuestro sitio web, el usuario acepta que el mal uso de esta información puede derivar en sanciones civiles y penales.",
            },
            {
                heading: "Protección de Datos Personales",
                text: "De acuerdo con lo estipulado por la Ley 1581 de 2012 y el Decreto 1377 de 2013 en Colombia, informamos que los datos personales registrados en nuestro sitio web serán recolectados con autorización previa, expresa e informada. Estos datos serán almacenados en bases de datos seguras y confidenciales, y utilizados para el envío de comunicados, promociones, eventos u otros fines publicitarios relacionados con AMMAE. Como cliente, usted puede conocer y acceder de manera gratuita a sus datos personales almacenados en este sitio, así como ejercer sus derechos como titular, conforme a lo establecido por la legislación vigente.",
            },
        ],
    },
    {
        id: "terms",
        label: "Términos",
        title: "Términos del Servicio",
        sections: [
            {
                text: "Gracias por visitar www.ammae.com. Al acceder a este sitio web, usted acepta los presentes Términos y Condiciones. Si no está de acuerdo con ellos, le solicitamos abandonar la navegación. AMMAE se reserva el derecho de actualizar o modificar estas condiciones en cualquier momento y sin previo aviso, por lo que recomendamos revisarlas de manera periódica.",
            },
            {
                heading: "Restricciones de Uso",
                text: "AMMAE no transfiere ningún derecho de propiedad intelectual a los usuarios del sitio. Todo el contenido, incluyendo imágenes, ilustraciones, gráficos, animaciones, diseño, código fuente, textos y logotipos, es propiedad exclusiva de AMMAE y sus aliados. Está prohibida la reproducción, distribución o explotación de cualquier contenido sin autorización previa y por escrito.",
            },
            {
                heading: "Terminación del Servicio",
                text: "AMMAE puede dar por terminado el servicio en cualquier momento sin previo aviso. Las disposiciones sobre derechos de autor, marcas, responsabilidad e indemnización permanecerán vigentes incluso después de la terminación.",
            },
            {
                heading: "Comunicaciones",
                text: "AMMAE podrá enviarle información a través de correo electrónico, avisos en el sitio web o correspondencia escrita. Si desea cancelar la suscripción, puede hacerlo en cualquier momento escribiendo a servicioammae@gmail.com.",
            },
            {
                heading: "Uso del Sitio",
                text: "Está estrictamente prohibido acosar a través del chat o correo electrónico, usar lenguaje vulgar, publicar contenido ilegal, difamatorio, obsceno o amenazante, así como realizar suplantación de identidad. El incumplimiento podrá generar sanciones conforme a la legislación vigente. AMMAE no garantiza que el sitio esté libre de interrupciones, errores o virus, aunque implementa medidas de seguridad para proteger la experiencia de sus usuarios.",
            },
            {
                heading: "Políticas de Precios",
                text: "Todos los precios publicados incluyen IVA conforme a la legislación colombiana vigente. En caso de errores tipográficos o de sistema en los precios, AMMAE se reserva el derecho de cancelar o rechazar pedidos realizados bajo tales condiciones.",
            },
            {
                heading: "Derecho de Retracto",
                text: "Conforme a la Ley 1480 de 2011 (Estatuto del Consumidor), el cliente tiene un plazo máximo de 5 días hábiles desde la entrega para ejercer el derecho de retracto. El producto debe devolverse en perfecto estado, con etiquetas y empaque original. Los costos de devolución serán asumidos por el cliente. Al cumplir las condiciones, se otorga el derecho de devolución de dinero.",
            },
            {
                heading: "Políticas de Cambio",
                text: "Para ejercer el derecho a un cambio, los productos deben estar sin uso, en su empaque original, con etiquetas intactas y presentando la factura de compra. El plazo máximo es de 8 días hábiles desde la entrega.",
            },
            {
                heading: "Reclamos por Calidad",
                text: "Si se presenta un defecto de calidad dentro de los 30 días posteriores a la entrega, AMMAE cubrirá los gastos de reparación o cambio. No aplican reclamos para productos en promoción o en casos de mal uso, lavado inadecuado o alteraciones realizadas por el cliente. Para mayor información, comuníquese con nuestro servicio al cliente a través de servicioammae@gmail.com.",
            },
        ],
    },
];

export const LEGAL_METADATA = {
    about: {
        title: "Sobre Nosotros | AMMAE Tienda de Ropa Urbana Multimarca",
        description: "Descubre AMMAE, una tienda de ropa urbana multimarca en Colombia. Conoce nuestra historia, nuestra visión y el compromiso con la cultura streetwear y el estilo auténtico.",
    },
    privacy: {
        title: "Política de Privacidad | AMMAE",
        description: "Consulta la política de privacidad de AMMAE. Conoce cómo protegemos y manejamos tus datos personales de acuerdo a la legislación colombiana.",
    },
    terms: {
        title: "Términos del Servicio | AMMAE",
        description: "Consulta los términos y condiciones de uso de AMMAE. Conoce tus derechos y deberes al utilizar nuestro sitio web y realizar compras online.",
    },
};