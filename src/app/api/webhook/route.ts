import { NextResponse } from "next/server";
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
        const clasesASumar = Number(payment.metadata.cantidad_clases);
        const monto = Number(payment.transaction_amount);
        
        // Mercado pago guarda el nombre del pack en "description"
        const conceptoPack = payment.description || `Pack ${clasesASumar} clases`;


        // 1. Obtener créditos actuales de la alumna
        const { data: perfil } = await supabase.from("perfiles").select("creditos_clases").eq("id", perfilId).single();

        if (perfil) {
          const nuevosCreditos = perfil.creditos_clases + clasesASumar;

          // 2. Sumarle los créditos a la alumna (Se actualiza el panel superior)
          await supabase.from("perfiles").update({ creditos_clases: nuevosCreditos }).eq("id", perfilId);
          
          // 3. Registrar el pago en el historial (Para VistaPagos y Finanzas)
          const { error: errorPago } = await supabase.from("pagos").insert([{
            perfil_id: perfilId,
            monto: monto,
            metodo_pago: "Mercado Pago",
            concepto: conceptoPack,
            cantidad_clases: clasesASumar,
            fecha: new Date().toISOString() // Obligamos a guardar la fecha exacta de hoy
          }]);

          if (errorPago) {
            console.error("❌ Error guardando el recibo en Supabase:", errorPago);
          } else {
            console.log("🧾 Recibo guardado exitosamente en el historial.");
          }
        }
      }
    } catch (error) {
      console.error("❌ Error procesando webhook:", error);
    }
  }

  return new Response("OK", { status: 200 });
}