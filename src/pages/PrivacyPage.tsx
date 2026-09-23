import { useNavigate } from "react-router-dom";

const CONTACT_EMAIL = "traeloofficial@gmail.com";

function BackButton() {
  const navigate = useNavigate();
  function goBack() {
    const idx = (window.history.state?.idx as number | undefined) ?? 0;
    if (idx > 0) navigate(-1);
    else navigate("/");
  }
  return (
    <button
      onClick={goBack}
      className="h-10 pl-2.5 pr-3.5 rounded-full bg-surface border border-border shadow-soft flex items-center gap-1.5 text-text-primary font-bold text-sm active:scale-95 transition-transform"
      aria-label="Volver"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Volver
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-6">
      <h2 className="text-base font-bold text-text-primary mb-2">{title}</h2>
      <div className="space-y-2 text-sm text-text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function EmailLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary underline">
      {CONTACT_EMAIL}
    </a>
  );
}

export function PrivacyPage() {
  return (
    <div className="animate-fade-in">
      <header className="px-4 pt-4 pb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="text-lg font-extrabold text-text-primary">Política de Privacidad</h1>
      </header>

      <div className="px-4 pb-10">
        <p className="text-xs font-semibold text-text-secondary">
          Última actualización: 23 de septiembre de 2026
        </p>

        <p className="mt-4 text-sm text-text-secondary leading-relaxed">
          Tráelo es una plataforma de compras y entrega a domicilio que permite a los
          usuarios descubrir negocios, consultar productos, realizar pedidos y
          recibirlos en la dirección indicada.
        </p>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          Esta Política de Privacidad explica cómo Tráelo recopila, utiliza,
          almacena, protege y comparte información relacionada con los usuarios de
          nuestra aplicación móvil y nuestros servicios digitales.
        </p>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          Al utilizar Tráelo, aceptas las prácticas descritas en esta Política de
          Privacidad.
        </p>

        <Section title="1. Responsable del tratamiento">
          <p>El servicio Tráelo es operado por Tráelo.</p>
          <p>
            Para cualquier consulta relacionada con privacidad, datos personales o
            solicitudes de eliminación de información, puedes contactar con
            nosotros a través de los canales oficiales de Tráelo.
          </p>
          <p>
            Correo de contacto: <EmailLink />
          </p>
        </Section>

        <Section title="2. Información que podemos recopilar">
          <p>
            Dependiendo de las funciones que utilices, Tráelo puede recopilar las
            siguientes categorías de información.
          </p>

          <h3 className="font-bold text-text-primary pt-2">2.1. Información de cuenta</h3>
          <p>Cuando creas o utilizas una cuenta, podemos recopilar información como:</p>
          <List
            items={[
              "Nombre.",
              "Número de teléfono.",
              "Dirección de correo electrónico, cuando sea proporcionada.",
              "Información necesaria para identificar y administrar tu cuenta.",
            ]}
          />
          <p>
            No necesitas proporcionar información adicional que no sea necesaria
            para utilizar las funciones correspondientes del servicio.
          </p>

          <h3 className="font-bold text-text-primary pt-2">2.2. Información de pedidos</h3>
          <p>
            Cuando realizas un pedido a través de Tráelo, podemos recopilar y
            almacenar información relacionada con la operación, incluyendo:
          </p>
          <List
            items={[
              "Productos solicitados.",
              "Cantidades.",
              "Negocios seleccionados.",
              "Importe del pedido.",
              "Tarifas de servicio y entrega.",
              "Dirección o instrucciones de entrega proporcionadas por el usuario.",
              "Nombre de la persona que recibirá el pedido, cuando sea diferente del usuario.",
              "Estado e historial de los pedidos.",
              "Fecha y hora del pedido.",
            ]}
          />
          <p>
            Esta información es necesaria para procesar, gestionar, entregar y
            mantener un historial de las compras realizadas mediante Tráelo.
          </p>

          <h3 className="font-bold text-text-primary pt-2">2.3. Direcciones de entrega</h3>
          <p>
            Si proporcionas una dirección para recibir un pedido, Tráelo puede
            almacenar dicha información para poder procesar y entregar
            correctamente el pedido y, cuando corresponda, permitirte reutilizarla
            en pedidos posteriores.
          </p>
          <p>Las direcciones pueden incluir información como:</p>
          <List
            items={[
              "Nombre o referencia del destinatario.",
              "Dirección escrita.",
              "Indicaciones adicionales para encontrar el lugar de entrega.",
              "Ubicación geográfica aproximada o coordenadas, únicamente cuando esta información sea proporcionada o utilizada mediante las funciones correspondientes de la aplicación.",
            ]}
          />

          <h3 className="font-bold text-text-primary pt-2">2.4. Información de ubicación</h3>
          <p>
            Tráelo puede ofrecer funciones relacionadas con la ubicación para
            facilitar la selección o gestión de direcciones de entrega.
          </p>
          <p>
            La aplicación no necesita acceder permanentemente a tu ubicación para
            permitirte utilizar las funciones básicas de compra.
          </p>
          <p>
            Cuando una función requiera acceso a la ubicación del dispositivo, la
            aplicación solicitará el permiso correspondiente al usuario.
          </p>
          <p>
            Puedes administrar o retirar los permisos de ubicación desde la
            configuración de tu dispositivo.
          </p>

          <h3 className="font-bold text-text-primary pt-2">
            2.5. Información del dispositivo y notificaciones
          </h3>
          <p>
            Si autorizas las notificaciones, Tráelo puede utilizar un
            identificador o token de notificación asociado a tu dispositivo para
            enviarte comunicaciones relacionadas con:
          </p>
          <List
            items={[
              "Estado de tus pedidos.",
              "Confirmaciones.",
              "Cambios importantes relacionados con un pedido.",
              "Promociones y novedades de Tráelo, cuando corresponda.",
              "Comunicaciones generales enviadas por Tráelo.",
            ]}
          />
          <p>
            El token de notificación se utiliza para permitir el envío técnico de
            estas comunicaciones y no constituye por sí mismo el contenido de tu
            dispositivo.
          </p>
          <p>
            Puedes administrar las notificaciones desde la configuración de tu
            dispositivo y, cuando corresponda, desde las opciones disponibles
            dentro de Tráelo.
          </p>

          <h3 className="font-bold text-text-primary pt-2">2.6. Información técnica</h3>
          <p>
            Podemos recopilar determinados datos técnicos necesarios para operar,
            mantener y proteger la aplicación, como:
          </p>
          <List
            items={[
              "Tipo y versión del dispositivo.",
              "Sistema operativo.",
              "Versión de la aplicación.",
              "Información técnica relacionada con errores o fallos.",
              "Información necesaria para detectar problemas de funcionamiento y seguridad.",
            ]}
          />
          <p>
            Esta información se utiliza principalmente para mantener la
            estabilidad, seguridad y funcionamiento correcto de Tráelo.
          </p>
        </Section>

        <Section title="3. Cómo utilizamos la información">
          <p>Tráelo utiliza la información recopilada para:</p>
          <List
            items={[
              "Crear y administrar cuentas cuando corresponda.",
              "Procesar y gestionar pedidos.",
              "Coordinar la entrega de los pedidos.",
              "Permitir que los negocios reciban y preparen los pedidos.",
              "Permitir que los mensajeros gestionen y entreguen pedidos.",
              "Mantener el historial de pedidos.",
              "Gestionar direcciones de entrega.",
              "Enviar notificaciones relacionadas con pedidos y con el funcionamiento del servicio.",
              "Enviar promociones, ofertas y novedades cuando corresponda.",
              "Detectar, prevenir y solucionar errores, abusos, fraude o problemas de seguridad.",
              "Mejorar el funcionamiento y la experiencia de usuario de Tráelo.",
              "Cumplir obligaciones legales aplicables.",
              "Proteger los derechos, seguridad y propiedad de Tráelo, sus usuarios, negocios y mensajeros.",
            ]}
          />
        </Section>

        <Section title="4. Pedidos y comunicación con negocios y mensajeros">
          <p>
            Para poder prestar el servicio de entrega, determinados datos
            necesarios para completar un pedido pueden ser compartidos con las
            partes que participan directamente en su preparación y entrega.
          </p>
          <p>Por ejemplo, dependiendo de la operación, un negocio puede necesitar conocer:</p>
          <List
            items={[
              "Productos solicitados.",
              "Cantidades.",
              "Información necesaria para preparar el pedido.",
              "Información necesaria para coordinar la entrega.",
            ]}
          />
          <p>El mensajero encargado de una entrega puede necesitar conocer información como:</p>
          <List
            items={[
              "Datos necesarios para identificar el pedido.",
              "Nombre o referencia del destinatario.",
              "Dirección e instrucciones de entrega.",
              "Información necesaria para completar la entrega.",
            ]}
          />
          <p>
            Tráelo limita esta información a aquella necesaria para prestar el
            servicio correspondiente.
          </p>
        </Section>

        <Section title="5. Proveedores de servicios">
          <p>
            Tráelo puede utilizar proveedores tecnológicos externos para operar
            determinados componentes de la plataforma, como infraestructura de
            servidores, bases de datos, distribución de notificaciones, mapas,
            almacenamiento u otros servicios técnicos.
          </p>
          <p>
            Estos proveedores pueden procesar información únicamente en la medida
            necesaria para proporcionar sus servicios a Tráelo.
          </p>
          <p>Entre los servicios tecnológicos utilizados por Tráelo pueden encontrarse proveedores como:</p>
          <List
            items={[
              "Supabase, para determinados servicios de infraestructura y base de datos.",
              "Vercel, para determinados servicios relacionados con infraestructura web.",
              "Render, para determinados servicios relacionados con infraestructura del backend.",
              "Expo y servicios relacionados, cuando sean utilizados para determinadas funciones de la aplicación y notificaciones.",
              "Servicios de mapas o cartografía utilizados por la aplicación.",
            ]}
          />
          <p>La lista de proveedores puede cambiar a medida que evolucione la plataforma.</p>
        </Section>

        <Section title="6. Pagos">
          <p>
            Cuando una operación implique un método de pago proporcionado por un
            tercero, la información necesaria para procesar dicho pago puede ser
            gestionada directamente por el proveedor correspondiente.
          </p>
          <p>
            Tráelo no necesita almacenar información completa de tarjetas
            bancarias, como el número completo de una tarjeta, cuando el
            procesamiento del pago se realiza mediante un proveedor externo.
          </p>
          <p>
            Los métodos de pago y proveedores disponibles pueden variar según el
            país, servicio y momento.
          </p>
        </Section>

        <Section title="7. Notificaciones y comunicaciones comerciales">
          <p>
            Tráelo puede enviar notificaciones relacionadas con el servicio,
            incluyendo actualizaciones sobre pedidos, confirmaciones y
            comunicaciones importantes.
          </p>
          <p>
            También podemos enviar comunicaciones comerciales, promociones,
            descuentos o novedades cuando corresponda.
          </p>
          <p>Puedes controlar determinadas notificaciones desde la configuración de tu dispositivo.</p>
          <p>
            Las comunicaciones estrictamente necesarias para prestar el servicio
            pueden continuar siendo enviadas cuando sean necesarias para gestionar
            un pedido o una cuenta.
          </p>
        </Section>

        <Section title="8. Uso de cookies y tecnologías similares">
          <p>
            Los sitios web de Tráelo pueden utilizar cookies, almacenamiento local
            y tecnologías similares para proporcionar determinadas funciones,
            mantener sesiones, mejorar el funcionamiento del sitio y comprender
            cómo se utiliza el servicio.
          </p>
          <p>
            La aplicación móvil puede utilizar tecnologías equivalentes necesarias
            para su funcionamiento.
          </p>
        </Section>

        <Section title="9. Seguridad">
          <p>
            Tráelo aplica medidas técnicas y organizativas razonables destinadas a
            proteger la información contra acceso no autorizado, pérdida,
            alteración, divulgación o destrucción.
          </p>
          <p>Entre estas medidas pueden incluirse:</p>
          <List
            items={[
              "Control de acceso basado en roles.",
              "Autenticación y autorización.",
              "Protección de credenciales.",
              "Conexiones cifradas cuando corresponda.",
              "Separación de entornos de desarrollo, pruebas y producción.",
              "Medidas destinadas a prevenir accesos no autorizados.",
            ]}
          />
          <p>
            Sin embargo, ningún sistema de almacenamiento o transmisión de
            información por Internet puede garantizar seguridad absoluta.
          </p>
        </Section>

        <Section title="10. Conservación de la información">
          <p>Conservamos la información durante el tiempo necesario para:</p>
          <List
            items={[
              "Proporcionar los servicios solicitados.",
              "Mantener registros de pedidos.",
              "Cumplir obligaciones legales o administrativas.",
              "Resolver disputas.",
              "Prevenir fraude y abusos.",
              "Mantener la seguridad de la plataforma.",
              "Hacer cumplir nuestros acuerdos y políticas.",
            ]}
          />
          <p>
            Cuando la información ya no sea necesaria para estos fines, podremos
            eliminarla, anonimizarla o conservarla únicamente cuando exista una
            razón legítima o una obligación legal para hacerlo.
          </p>
        </Section>

        <Section title="11. Eliminación de la cuenta y de los datos">
          <p>Puedes solicitar la eliminación de tu cuenta y de los datos personales asociados a ella.</p>
          <p>
            Las solicitudes de eliminación pueden estar sujetas a determinadas
            excepciones cuando Tráelo necesite conservar información por razones
            legales, de seguridad, prevención de fraude, resolución de disputas o
            mantenimiento de registros de transacciones.
          </p>
          <p>
            Para solicitar la eliminación de tu información, puedes contactar con:{" "}
            <EmailLink />
          </p>
          <p>La solicitud debe incluir información suficiente para identificar la cuenta correspondiente.</p>
          <p>
            Cuando la eliminación sea posible, Tráelo procederá a eliminar o
            anonimizar la información personal correspondiente, salvo aquella que
            deba conservarse por una razón legítima o legal.
          </p>
        </Section>

        <Section title="12. Datos de menores">
          <p>Tráelo no está diseñado específicamente para niños.</p>
          <p>
            No recopilamos deliberadamente información personal de menores de
            edad para crear cuentas o utilizar el servicio cuando la legislación
            aplicable prohíba dicha recopilación.
          </p>
          <p>
            Si consideras que un menor ha proporcionado información personal a
            Tráelo sin la autorización correspondiente, puedes contactarnos para
            solicitar su revisión y eliminación.
          </p>
        </Section>

        <Section title="13. Transferencias y procesamiento internacional">
          <p>
            Dependiendo de los proveedores tecnológicos utilizados por Tráelo,
            determinada información puede ser procesada o almacenada en
            servidores ubicados fuera del país donde resides.
          </p>
          <p>
            Cuando esto ocurra, procuraremos utilizar proveedores que implementen
            medidas apropiadas de seguridad y protección de datos.
          </p>
        </Section>

        <Section title="14. Derechos de los usuarios">
          <p>
            Dependiendo de la legislación aplicable, puedes tener derechos
            relacionados con tus datos personales, incluyendo:
          </p>
          <List
            items={[
              "Solicitar acceso a determinada información personal.",
              "Solicitar corrección de información incorrecta.",
              "Solicitar eliminación de información.",
              "Solicitar determinadas restricciones sobre el procesamiento.",
              "Retirar determinados permisos otorgados al dispositivo.",
              "Solicitar información sobre cómo se utiliza tu información.",
            ]}
          />
          <p>
            Para ejercer estos derechos, puedes contactar con Tráelo mediante el
            correo indicado en esta política.
          </p>
        </Section>

        <Section title="15. Cambios en esta Política de Privacidad">
          <p>
            Podemos actualizar esta Política de Privacidad cuando cambien
            nuestros servicios, prácticas de tratamiento de datos, proveedores
            tecnológicos o requisitos legales.
          </p>
          <p>
            Cuando realicemos cambios relevantes, actualizaremos la fecha de
            "Última actualización" indicada al comienzo de esta política.
          </p>
          <p>Te recomendamos revisar periódicamente esta página para conocer la versión vigente.</p>
        </Section>

        <Section title="16. Contacto">
          <p>
            Si tienes preguntas, solicitudes o inquietudes relacionadas con esta
            Política de Privacidad o con el tratamiento de tus datos personales,
            puedes contactarnos:
          </p>
          <p className="font-semibold text-text-primary">Tráelo</p>
          <p>
            Correo: <EmailLink />
          </p>
          <p>
            Sitio web:{" "}
            <a
              href="https://traelo-market.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              https://traelo-market.com
            </a>
          </p>
          <p className="text-xs font-semibold text-text-secondary pt-2">
            Última actualización: 23 de septiembre de 2026
          </p>
        </Section>
      </div>
    </div>
  );
}
