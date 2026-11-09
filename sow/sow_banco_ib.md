# STATEMENT OF WORK (SOW)
## Proyecto: Asistente Virtual Inteligente WhatsApp & Integración Core Bancario
### Cliente: Banco IB | Proveedor: Infobip Latam Solutions Engineering

---

| **Documento** | Statement of Work (SOW) - Banco IB |
|---|---|
| **Versión** | 1.0 - Definitivo para Producción / Demostración |
| **Fecha** | Noviembre 2026 |
| **Líder Técnico** | Solutions Engineering Lead - Infobip |
| **Patrocinador Cliente** | Vicepresidencia de Canales Digitales & Operaciones - Banco IB |

---

## 1. Resumen Ejecutivo y Contexto de Negocio

El **Banco IB** se encuentra en una etapa estratégica de modernización de su experiencia de atención al cliente. Actualmente, la demanda de consultas y onboarding por canales no asistidos experimenta tiempos de espera considerables y fricciones en la verificación de identidad. 

Para resolver este desafío, **Infobip** propone el despliegue de una solución integral basada en la plataforma **Infobip Answers** (motor de chatbots impulsado por IA y reglas conversacionales), conectada a través del canal oficial de **WhatsApp Business Platform**, con integración en tiempo real al **Core Bancario de Banco IB** para la validación crediticia y registral de CPF, y derivación contextual sin pérdida de datos hacia **Infobip Conversations** (Contact Center Omnicanal en la nube).

### Objetivos del Proyecto
* **Automatización y Eficiencia:** Automatizar el 75%+ de las consultas de validación inicial y captura de datos.
* **Seguridad y Validación Estricta:** Implementar doble anillo de validación de documento (algoritmo Módulo 11 en el perímetro conversacional + validación contra API de Core Bancario).
* **Experiencia de Usuario Superior:** Reducir el tiempo de derivación a un agente humano a menos de 5 segundos, entregando el 100% de los datos precargados en la pantalla del operador.
* **Trazabilidad y Cumplimiento:** Registro auditable de eventos en concordancia con normativas de protección de datos personales (LGPD).

---

## 2. Alcance del Proyecto (In-Scope)

### 2.1 Módulo Conversacional (Infobip Answers)
* **Canal:** WhatsApp Business API verificado con plantilla interactiva de bienvenida.
* **Validación Perimetral de CPF:**
  * Verificación de sintaxis mediante Expresión Regular (`^\d{3}\.\d{3}\.\d{3}-\d{2}$` o `^\d{11}$`).
  * Ejecución de función JavaScript nativa en el nodo perimetral aplicando el algoritmo de **Módulo 11** para verificar los 2 dígitos verificadores (DV1 y DV2) y rechazo de patrones repetidos (`111.111.111-11`, etc.).
* **Captura Progresiva de Datos:**
  * Recopilación de Nombre Completo y Correo Electrónico tras la aprobación del CPF.
* **Confirmación Interactiva:**
  * Envío de mensaje enriquecido con botones de respuesta rápida (*Quick Replies*): `[Confirmar]` y `[Modificar]`.
  * Gestión de flujo de reintento en caso de solicitar modificaciones.

### 2.2 Integración Core Bancario (Webhooks REST)
* Integración bidireccional mediante Webhook HTTPS POST al endpoint `/v1/validate-cpf`.
* Procesamiento de respuesta JSON (`status`, `score`, `client_tier`, `account_exists`).
* Bifurcación condicional en el flujo según el estatus del cliente (Aprobado, Bloqueado o Prospecto Nuevo).

### 2.3 Unificación de Datos de Cliente (Infobip People CDP)
* Creación y enriquecimiento automático del perfil del cliente indexado por número de teléfono (WhatsApp ID) y CPF.
* Persistencia de atributos personalizados: `CPF`, `Email`, `Nombre`, `Credit_Score`, `Client_Tier`.

### 2.4 Derivación Contextual (Infobip Conversations)
* Transferencia automática del hilo conversacional a la cola de atención humana especializada.
* Inyección de datos en la tarjeta del cliente (*Customer Context Card*) en la consola del agente:
  * Historial conversacional previo con el chatbot.
  * Score crediticio, nivel de cliente (*PREMIUM* / *STANDARD*) y datos de contacto confirmados.
  * Habilitación de atención simultánea y respuestas predefinidas (*Canned Responses*).

### 2.5 Tableros de Control y Analítica
* Monitoreo de indicadores en tiempo real: tasa de finalización del bot, tiempos de respuesta, tasa de caída por validación de CPF y volumen de transferencias hacia agentes humanos.

---

## 3. Elementos Fuera de Alcance (Out-of-Scope)

* Modificaciones internas en los sistemas legados o mainframes del Banco IB.
* Desarrollo de pasarelas de pago o transacciones de débito directo en esta fase.
* Integración con canales de voz o telefonía física (previstos para la Fase 2).

---

## 4. Diseño de Arquitectura de la Solución

```mermaid
flowchart LR
    A["📱 Cliente WhatsApp"] -->|"1. Inicia chat"| B["💬 Infobip Answers"]
    B -->|"2. Validación Regex + Módulo 11 (JS)"| B
    B -->|"3. POST /v1/validate-cpf"| C["🌐 Core Bancario API"]
    C -->|"4. Status, Score, Tier"| B
    B -->|"5. Botones Confirmar/Modificar"| A
    B -->|"6. Sincroniza atributos"| D[("👤 People CDP")]
    B -->|"7. Transferencia con contexto"| E["🎧 Infobip Conversations"]
    E -->|"8. Atención en vivo"| F["👨‍💼 Agente Banco IB"]
```

---

## 5. Cronograma del Proyecto y Diagrama de Gantt

El proyecto contempla una duración total de **8 semanas**, estructurado en 5 etapas secuenciales:

```mermaid
gantt
    title Cronograma de Implementación - Chatbot WhatsApp Banco IB
    dateFormat  YYYY-MM-DD
    axisFormat  Sem %W
    section 1. Descubrimiento y Diseño
    Kickoff y Alineación de Requerimientos     :active, des1, 2026-11-10, 5d
    Diseño de Flujo Conversacional & UX/UI    :des2, after des1, 5d
    Especificación de APIs e Integración      :des3, after des1, 5d
    Aprobación del SOW y Arquitectura         :milestone, m1, after des2, 0d

    section 2. Desarrollo & Mocking
    Configuración de Cuenta & WhatsApp WABA   :dev1, 2026-11-20, 5d
    Implementación Algoritmo JS Módulo 11     :dev2, after dev1, 4d
    Configuración y Pruebas de API Mock       :dev3, after dev1, 4d
    Construcción del Flujo en Infobip Answers :dev4, after dev2, 7d

    section 3. Integración & Contact Center
    Conexión Webhook Answers a Core Bancario  :int1, after dev4, 5d
    Configuración de Colas en Conversations   :int2, after dev4, 4d
    Mapeo de Atributos en Infobip People CDP  :int3, after int1, 3d

    section 4. Pruebas & Calidad (QA/UAT)
    Pruebas Integrales de Seguridad y Carga   :qa1, after int2, 5d
    UAT con el Equipo de Banco IB             :qa2, after qa1, 6d
    Capacitación a Supervisores y Agentes     :qa3, after qa2, 3d
    Aprobación UAT Go/No-Go                   :milestone, m2, after qa2, 0d

    section 5. Go-Live & Hipercare
    Despliegue a Producción (Corte)           :live1, 2027-01-08, 2d
    Soporte Hypercare 24/7 (SLA Nivel 1)      :live2, after live1, 10d
    Cierre Formal del Proyecto & Traspaso     :milestone, m3, after live2, 0d
```

---

## 6. Matriz de Responsabilidades (RACI)

| Actividad / Entregable | Infobip Solutions Eng. | Equipo TI Banco IB | Negocio / Canales IB |
|---|:---:|:---:|:---:|
| Diseño del flujo conversacional (Answers) | **R / A** | C | C |
| Desarrollo del script de validación JS | **R / A** | C | I |
| Exposición del endpoint de Core Bancario | C | **R / A** | I |
| Configuración de WhatsApp Business Account | **R** | A | C |
| Configuración de colas en Conversations | **R / A** | C | C |
| Pruebas de Aceptación de Usuario (UAT) | C | C | **R / A** |
| Aprobación final y Paso a Producción | C | **A** | **A** |

*Leyenda: **R** = Responsable de ejecutar, **A** = Aprobador final, **C** = Consultado, **I** = Informado.*

---

## 7. Acuerdos de Nivel de Servicio (SLA) & Seguridad

1. **Disponibilidad de la Plataforma:** 99.95% de disponibilidad mensual (*Infobip Enterprise SLA*).
2. **Latencia de Mensajería:** Tiempos de entrega de mensajes interactivos menores a 1.2 segundos.
3. **Seguridad y Cifrado:**
   * Cifrado en tránsito (TLS 1.3) y en reposo (AES-256).
   * Cifrado de extremo a extremo nativo del protocolo de WhatsApp.
   * Certificaciones: ISO 27001, SOC 2 Tipo II, PCI-DSS Nivel 1.
4. **Protección de Datos:** Cumplimiento irrestricto de las leyes de secreto bancario y protección de datos personales (LGPD en Brasil y normativas equivalentes en Latinoamérica).

---

## 8. Criterios de Aceptación del Proyecto

El proyecto se considerará formalmente aprobado cuando se verifique satisfactoriamente:
1. El chatbot solicita y valida de forma infalible el formato y la fórmula Módulo 11 de CPFs reales y de prueba.
2. La API de validación responde con código 200 y enriquece la sesión con score y categoría de cliente.
3. El usuario puede confirmar o corregir sus datos mediante botones interactivos nativos de WhatsApp.
4. Al confirmar los datos, la sesión es transferida a un agente humano en **Infobip Conversations** en menos de 5 segundos, mostrando en pantalla el CPF validado, el nombre, el email y el historial.
