import { PrismaClient, StatusPedido } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function base() {
  const adminEmail = "admin@edecio.delivery";
  const userEmail = "cliente@edecio.delivery";
  if (!await prisma.usuario.findUnique({ where: { email: adminEmail } })) {
    await prisma.usuario.create({ data: { nome: "Admin", email: adminEmail, senha: await bcrypt.hash("admin123", 10), papel: "ADMIN" } });
  }
  if (!await prisma.usuario.findUnique({ where: { email: userEmail } })) {
    await prisma.usuario.create({ data: { nome: "Cliente", email: userEmail, senha: await bcrypt.hash("123456", 10), papel: "USUARIO" } });
  }
  const r = await prisma.restaurante.upsert({
    where: { nome: "Delícias do Edécio" },
    create: { nome: "Delícias do Edécio", categoria: "Caseira", imagem_url: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1600&auto=format&fit=crop" },
    update: {}
  });
  await prisma.itemCardapio.deleteMany({ where: { restaurante_id: r.id } });
  const itens = await prisma.$transaction([
    prisma.itemCardapio.create({ data: { nome:"Prato Feito do Edécio", descricao:"Arroz, feijão, bife acebolado, salada e batata frita", preco_centavos:3490, restaurante_id:r.id, destaque:true, imagem_url:"https://images.unsplash.com/photo-1604908815070-c3a9c49a61b9?q=80&w=1600&auto=format&fit=crop" } }),
    prisma.itemCardapio.create({ data: { nome:"Lasanha à Bolonhesa", descricao:"Massa fresca com molho bolonhesa e muito queijo", preco_centavos:4290, restaurante_id:r.id, destaque:true, imagem_url:"https://images.unsplash.com/photo-1604908177076-9f17d4a2a3c3?q=80&w=1600&auto=format&fit=crop" } }),
    prisma.itemCardapio.create({ data: { nome:"Strogonoff de Frango", descricao:"Acompanha arroz e batata palha", preco_centavos:3790, restaurante_id:r.id, destaque:false, imagem_url:"https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1600&auto=format&fit=crop" } }),
    prisma.itemCardapio.create({ data: { nome:"Hambúrguer da Casa", descricao:"Blend artesanal, cheddar e pão brioche", preco_centavos:3290, restaurante_id:r.id, destaque:false, imagem_url:"https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1600&auto=format&fit=crop" } }),
    prisma.itemCardapio.create({ data: { nome:"Brownie com Sorvete", descricao:"Sobremesa queridinha da casa", preco_centavos:1990, restaurante_id:r.id, destaque:true, imagem_url:"https://images.unsplash.com/photo-1606313564200-e75d5e30476f?q=80&w=1600&auto=format&fit=crop" } }),
  ]);
  return { r, itens };
}

async function pedidosExemplo() {
  const cliente = await prisma.usuario.findFirst({ where: { email: "cliente@edecio.delivery" } });
  const r = await prisma.restaurante.findFirst({ where: { nome: "Delícias do Edécio" } });
  const itens = await prisma.itemCardapio.findMany({ where: { restaurante_id: r?.id } });
  if (!cliente || !r || itens.length === 0) return;

  const pick = (s: string) => itens.find(i => (i.nome||"").toLowerCase().includes(s)) || itens[0];
  const exemplos = [
    { status: StatusPedido.PENDENTE,   endereco:"Rua A, 123", itens:[{i:pick("prato"),q:1},{i:pick("hamb"),q:2}] },
    { status: StatusPedido.CONFIRMADO, endereco:"Rua B, 456", itens:[{i:pick("lasanha"),q:1}] },
    { status: StatusPedido.PREPARANDO, endereco:"Rua C, 789", itens:[{i:pick("strog"),q:1}] },
    { status: StatusPedido.A_CAMINHO,  endereco:"Rua D, 101", itens:[{i:pick("prato"),q:2}] },
    { status: StatusPedido.ENTREGUE,   endereco:"Rua E, 202", itens:[{i:pick("brownie"),q:3}] },
    { status: StatusPedido.CANCELADO,  endereco:"Rua F, 303", itens:[{i:pick("hamb"),q:1}] },
  ];

  for (const ex of exemplos) {
    const total = ex.itens.reduce((s, it) => s + it.i.preco_centavos * it.q, 0);
    const pedido = await prisma.pedido.create({
      data: {
        usuario_id: cliente.id,
        restaurante_id: r.id,
        status: ex.status,
        endereco: ex.endereco,
        total_centavos: total,
        itens: { create: ex.itens.map(it => ({ item_id: it.i.id, quantidade: it.q, preco_centavos: it.i.preco_centavos })) }
      }
    });
    if (ex.status === StatusPedido.ENTREGUE) {
      await prisma.avaliacao.create({ data: { pedido_id: pedido.id, usuario_id: cliente.id, restaurante_id: r.id, nota: 5, comentario: "Perfeito!" } });
    }
  }
  console.log("✔ Pedidos de exemplo criados");
}

async function main(){
  await base();
  await pedidosExemplo();
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
