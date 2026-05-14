import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  const body = await request.json();
  const { tipo, perfilId } = body;

  try {
    let preferenceBody: any = {
      external_reference: perfilId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL}/alumna?pago=exitoso`,
        failure: `${process.env.NEXT_PUBLIC_URL}/alumna?pago=error`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhook`,
    };

    // SI COMPRA UN PACK DE CLASES
    if (tipo === "pack") {
      const { pack } = body;
      const { data: configData } = await supabase.from("configuracion").select("valor").eq("key", "precios_packs").single();
      const preciosConfig = configData?.valor || {};
      const precioReal = preciosConfig[pack.cantidad_clases.toString()];

      if (!precioReal) throw new Error("Este pack no está configurado");

      preferenceBody.items = [{
        id: `pack-${pack.cantidad_clases}`,
        title: pack.cantidad_clases === 1 ? "Clase Suelta" : `Pack ${pack.cantidad_clases} clases`,
        quantity: 1,
        unit_price: Number(precioReal),
        currency_id: "ARS",
      }];
      preferenceBody.metadata = { tipo: "pack", cantidad_clases: pack.cantidad_clases };

    } 
    // SI PAGA UN EVENTO
    else if (tipo === "evento") {
      const { evento } = body;
      const precioReal = evento.precio || evento.precio_evento || 0;
      
      preferenceBody.items = [{
        id: `evento-${evento.id}`,
        title: `Evento: ${evento.nivel}`,
        quantity: 1,
        unit_price: Number(precioReal),
        currency_id: "ARS",
      }];
      preferenceBody.metadata = { 
        tipo: "evento", 
        evento_id: evento.id,
        fecha_evento: evento.fecha
      };
    }

    const preference = await new Preference(client).create({ body: preferenceBody });
    return NextResponse.json({ init_point: preference.init_point });
  } catch (error: any) {
    console.error("Error en Checkout:", error.message);
    return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
  }
}