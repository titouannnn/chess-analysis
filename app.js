import * as sc from "./script.js";
import * as li from "./litchess.js";


const app = document.getElementById("app");

let NomUtilisateur = "";

if (NomUtilisateur === "") {
  app.innerHTML = `
                <h1>Bienvenue !</h1>
                <form id="welcome-form">
                    <input
                    type="text"
                    id="username"
                    placeholder="Entrez votre nom d'utilisateur"
                    required
                    />
                    <button type="submit">Entrer</button>
                </form>
                `;

  const form = document.getElementById("welcome-form");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    NomUtilisateur = document.getElementById("username").value;
    if (NomUtilisateur !== "") {
      loadMainPage();
    }
  });
}
function loadMainPage() {
  NomUtilisateur = sc.getUsername();
  app.innerHTML = `
        <h1>Bienvenue, ${NomUtilisateur} !</h1>
        
    `;
}
