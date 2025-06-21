import prisma from "@/db";

export async function POST({ request }) {
  const { eventos } = await request.json();

  if (!Array.isArray(eventos) || eventos.length !== 6) {
    return new Response(JSON.stringify({
      success: false,
      message: "Debes seleccionar exactamente 6 eventos."
    }), { status: 400 });
  }

  try {
    await prisma.eventos.updateMany({
      data: { es_destacado: false },
      where: { es_destacado: true }
    });

    await prisma.eventos.updateMany({
      data: { es_destacado: true },
      where: { id_eve: { in: eventos } }
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Eventos destacados actualizados correctamente."
    }), { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      success: false,
      message: "Error en el servidor"
    }), { status: 500 });
  }
}
