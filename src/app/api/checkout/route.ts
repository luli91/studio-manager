import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
// Usamos Service Role para poder leer la configuración sin problemas de permisos
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  const { pack, perfilId } = await request.json();

  try {
    // 1. Buscamos los precios que Flor configuró en su panel
    const { data: configData } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("key", "precios_packs")
      .single();

    if (!configData) throw new Error("No se encontró la configuración de precios");

    const preciosConfig = configData.valor;
    
    // 2. Obtenemos el precio real para la cantidad de clases que eligió la alumna
    // Si eligió 4 clases, buscamos preciosConfig["4"]
    const precioReal = preciosConfig[pack.cantidad_clases.toString()];

    if (!precioReal) throw new Error("Este pack no está configurado");

    const preference = await new Preference(client).create({
      body: {
        items: [
          {
            id: `pack-${pack.cantidad_clases}`,
            title: pack.cantidad_clases === 1 ? "Clase Suelta" : `Pack ${pack.cantidad_clases} clases`,
            quantity: 1,
            unit_price: Number(precioReal),
            currency_id: "ARS",
          },
        ],
        external_reference: perfilId, 
        metadata: {
          cantidad_clases: pack.cantidad_clases,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_URL}/alumna?pago=exitoso`,
          failure: `${process.env.NEXT_PUBLIC_URL}/alumna?pago=error`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhook`, 
      },
    });

    return NextResponse.json({ init_point: preference.init_point });
  } catch (error: any) {
    console.error("Error en Checkout:", error.message);
    return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
  }
}