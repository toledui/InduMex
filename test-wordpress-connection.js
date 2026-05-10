const WORDPRESS_URL = "https://indumex.blog/graphql";

const query = `
  query GetAllPosts($first: Int = 1) {
    posts(first: $first) {
      nodes {
        id
        title
        slug
      }
    }
  }
`;

async function testConnection() {
  console.log("🔍 Probando conexión a WordPress...");
  console.log(`📍 URL: ${WORDPRESS_URL}\n`);

  try {
    const response = await fetch(WORDPRESS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { first: 1 } }),
    });

    console.log(`✅ Status HTTP: ${response.status} ${response.statusText}`);
    console.log(`📦 Headers:`, Object.fromEntries(response.headers.entries()));

    const json = await response.json();

    if (json.errors) {
      console.log("\n❌ Errores GraphQL:");
      json.errors.forEach((err) => {
        console.log(`  - ${err.message}`);
      });
    }

    if (json.data) {
      console.log("\n✅ Datos recibidos:");
      console.log(`  - Posts encontrados: ${json.data.posts.nodes.length}`);
      if (json.data.posts.nodes.length > 0) {
        console.log(`  - Primer post: "${json.data.posts.nodes[0].title}"`);
      }
    }

    if (!json.data && !json.errors) {
      console.log("\n⚠️ Respuesta inesperada:");
      console.log(json);
    }
  } catch (error) {
    console.error("\n❌ Error de conexión:");
    console.error(`  ${error.message}`);
  }
}

testConnection();
