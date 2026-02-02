const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : '/api';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchRecipes();

    // Add Recipe Form Handler
    const recipeForm = document.getElementById('recipe-form');
    recipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const ingredients = document.getElementById('ingredients').value.split(',').map(i => i.trim());
        const steps = document.getElementById('steps').value;

        try {
            const response = await fetch(`${API_URL}/recipes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, ingredients, steps })
            });

            if (response.ok) {
                recipeForm.reset();
                fetchRecipes();
            }
        } catch (error) {
            console.error('Error adding recipe:', error);
            alert('Could not connect to the backend server.');
        }
    });

    // AI Suggestion Handler
    const suggestBtn = document.getElementById('suggest-btn');
    suggestBtn.addEventListener('click', async () => {
        const ingredientsInput = document.getElementById('ai-ingredients').value;
        if (!ingredientsInput) return;

        const ingredients = ingredientsInput.split(',').map(i => i.trim());

        try {
            suggestBtn.textContent = 'Thinking...';
            suggestBtn.disabled = true;

            const response = await fetch(`${API_URL}/ai-recipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ingredients })
            });

            const data = await response.json();

            const aiResult = document.getElementById('ai-result');
            const suggestContent = document.querySelector('.suggestion-content');

            if (!response.ok) {
                // Show the error message from the backend (like "API Key is missing")
                suggestContent.innerHTML = `<p style="color: #ff6b6b; font-weight: 600;">⚠️ Error: ${data.detail || 'Something went wrong'}</p>`;
            } else {
                // Format for success display
                suggestContent.innerHTML = `
                    <pre id="raw-suggestion" style="white-space: pre-wrap; font-family: inherit; font-size: 0.95rem; color: var(--dark); margin-bottom: 1.5rem;">${data.suggestion}</pre>
                    <button id="save-ai-btn" class="secondary-btn">Add to My Recipes</button>
                `;
                // Handle Saving AI Recipe
                document.getElementById('save-ai-btn').addEventListener('click', () => saveAIRecipe(data.suggestion));
            }
            aiResult.classList.remove('hidden');

        } catch (error) {
            console.error('Error getting AI suggestion:', error);
            alert('Could not connect to the backend server.');
        } finally {
            suggestBtn.textContent = 'Magic ✨';
            suggestBtn.disabled = false;
        }
    });

    // Theme Toggle Handler
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', toggleTheme);
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const iconSpan = document.getElementById('theme-icon');
    iconSpan.textContent = theme === 'dark' ? '🌙' : '☀️';
}

async function fetchRecipes() {
    try {
        const response = await fetch(`${API_URL}/recipes`);
        const recipes = await response.json();
        renderRecipes(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        const container = document.getElementById('recipes-container');
        container.innerHTML = '<p style="color:red">Error: Backend server is not running.</p>';
    }
}

function renderRecipes(recipes) {
    const container = document.getElementById('recipes-container');
    container.innerHTML = '';

    if (recipes.length === 0) {
        container.innerHTML = '<p>No recipes added yet. Start by adding one!</p>';
        return;
    }

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'card recipe-card';

        card.innerHTML = `
            <div class="recipe-content">
                <h3>${recipe.name}</h3>
                <p class="ingredients"><strong>Ingredients:</strong> ${recipe.ingredients.join(', ')}</p>
                <p class="steps">${recipe.steps}</p>
                <button class="delete-btn" onclick="deleteRecipe(${recipe.id})">Delete Recipe</button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function deleteRecipe(id) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
        const response = await fetch(`${API_URL}/recipes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fetchRecipes();
        }
    } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Could not connect to the backend server.');
    }
}

async function saveAIRecipe(text) {
    // Simple parser to extract Name, Ingredients, and Steps from the AI text
    const lines = text.split('\n');
    let name = "AI Suggestion";
    let ingredients = [];
    let steps = "";

    let currentSection = "";

    lines.forEach(line => {
        if (line.startsWith('Recipe Name:')) {
            name = line.replace('Recipe Name:', '').trim();
        } else if (line.startsWith('Ingredients:')) {
            currentSection = "ing";
        } else if (line.startsWith('Preparation Steps')) {
            currentSection = "steps";
        } else if (line.trim() !== "") {
            if (currentSection === "ing") {
                ingredients.push(line.replace(/^- /, '').trim());
            } else if (currentSection === "steps") {
                steps += line.trim() + " ";
            }
        }
    });

    try {
        const response = await fetch(`${API_URL}/recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                ingredients: ingredients.length > 0 ? ingredients : ["As per suggestion"],
                steps: steps || text
            })
        });

        if (response.ok) {
            alert('Recipe saved to your collection!');
            document.getElementById('ai-result').classList.add('hidden');
            fetchRecipes();
        }
    } catch (error) {
        alert('Failed to save recipe.');
    }
}
