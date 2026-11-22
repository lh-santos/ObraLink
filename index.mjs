import { db } from "./database/db.mjs";
import { ref, get } from "firebase/database";

try {
    const dbref = ref(db, "ping");
    const snapshot = await get(dbref);

    if (!snapshot.exists()) {
        console.log("Dado não existente");
    } else {
        const data = snapshot.val();

        console.log("Sucesso ao conectar!");
        console.log(data);
    }

} catch (error) {
    console.error("Erro ao conectar:", error);
}
