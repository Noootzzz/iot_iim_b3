import { db } from "@/db";
import { users } from "@/db/schema";
import { revalidatePath } from "next/cache";

// Cette page est un Server Component par défaut
export default async function Page() {
  
  // 1. On récupère les utilisateurs existants pour les afficher
  const allUsers = await db.select().from(users);

  // 2. La Server Action pour créer un user
  async function create(formData: FormData) {
    'use server';
    
    const username = formData.get('username')?.toString();
    
    if (!username) return;

    // Insertion via Drizzle
    await db.insert(users).values({
      username: username,
      // Comme l'email est unique et obligatoire dans le schéma, on en génère un faux pour le test
      email: `${username}-${Date.now()}@test.com`, 
    });

    // On rafraîchit la page pour voir le nouveau user apparaître
    revalidatePath('/');
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Test Base de Données (Neon + Drizzle)</h1>

      {/* Formulaire d'ajout */}
      <form action={create} style={{ marginBottom: "20px" }}>
        <input 
          type="text" 
          name="username" 
          placeholder="Nom du user..." 
          style={{ padding: "8px", marginRight: "10px", color: "black" }}
          required
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          Ajouter User
        </button>
      </form>

      <hr />

      {/* Liste des résultats */}
      <h2>Liste des Users ({allUsers.length}) :</h2>
      <ul>
        {allUsers.map((user) => (
          <li key={user.id}>
            <strong>{user.username}</strong> - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}