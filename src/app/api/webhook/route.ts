import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("data.id");
  const type = url.searchParams.get("type");

  if (type === "payment" && paymentId) {
    try {
      const payment = await new Payment(client).get({ id: paymentId });

      if (payment.status === "approved") {
        const perfilId = payment.external_reference;
        const monto = Number(payment.transaction_amount);
        const metadata = payment.metadata;

        // ACCIÓN 1: SI COMPRÓ UN PACK
        if (metadata.tipo === "pack") {
          const clasesASumar = Number(metadata.cantidad_clases);
          const conceptoPack = payment.description || `Pack ${clasesASumar} clases`;

          const { data: perfil } = await supabase.from("perfiles").select("creditos_clases").eq("id", perfilId).single();
          if (perfil) {
            await supabase.from("perfiles").update({ creditos_clases: perfil.creditos_clases + clasesASumar }).eq("id", perfilId);
            await supabase.from("pagos").insert([{
              perfil_id: perfilId, monto: monto, metodo_pago: "Mercado Pago", concepto: conceptoPack, cantidad_clases: clasesASumar, fecha: new Date().toISOString()
            }]);
          }
        } 
        
        // ACCIÓN 2: SI PAGÓ UN EVENTO
        else if (metadata.tipo === "evento") {
          const eventoId = metadata.evento_id;
          const fechaEvento = metadata.fecha_evento;
          const conceptoEvento = payment.description || "Inscripción a Evento";

          // Anotamos a la alumna directo en la grilla
          await supabase.from('reservas').upsert({
            perfil_id: perfilId,
            clase_id: eventoId,
            fecha_clase: fechaEvento,
            estado: 'confirmada'
          }, { onConflict: 'perfil_id,clase_id,fecha_clase' });

          // Registramos el pago para las finanzas de Flor
          await supabase.from("pagos").insert([{
            perfil_id: perfilId, monto: monto, metodo_pago: "Mercado Pago", concepto: conceptoEvento, cantidad_clases: 0, fecha: new Date().toISOString()
          }]);
        }
      }
    } catch (error) {
      console.error("❌ Error procesando webhook:", error);
    }
  }

  return new Response("OK", { status: 200 });
}