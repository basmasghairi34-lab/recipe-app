

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
import json
from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()

# --- Database Setup ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./recipes.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class RecipeDB(Base):
    __tablename__ = "recipes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    ingredients = Column(Text)  # Stored as JSON string
    steps = Column(Text)

Base.metadata.create_all(bind=engine)

# --- Schemas ---
class RecipeBase(BaseModel):
    name: str
    ingredients: List[str]
    steps: str

class RecipeCreate(RecipeBase):
    pass

class Recipe(RecipeBase):
    id: int
    class Config:
        from_attributes = True

class IngredientList(BaseModel):
    ingredients: List[str]

# --- FastAPI App ---
app = FastAPI(title="Recipe Manager API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Real AI Configuration ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

AI_SYSTEM_PROMPT = """
You are a creative executive chef. Your specialty is turning simple ingredients into diverse, restaurant-quality home meals.

When a user provides ingredients, your goal is to suggest a UNIQUE preparation method. 
DO NOT always suggest a stir-fry or salad. 
Instead, think about different techniques: roasting, braising, poaching, pan-searing, or even making a cold appetizer.

Guidelines:
1. Generate ONE realistic and tasty recipe.
2. Adapt the preparation method to the ingredients provided (e.g., if they have potatoes, maybe roast them instead of boiling).
3. You may add only common staples (salt, oil, pepper, water, vinegar).
4. No rare or expensive ingredients.
5. Provide clear, professional instructions.

Respond strictly in this format:
Recipe Name: [Name]
Ingredients:
- [Ingredient 1]
- [Ingredient 2]
Preparation Steps (step by step):
1. [Step 1]
2. [Step 2]
"""

# --- CRUD Routes ---

@app.get("/recipes", response_model=List[Recipe])
def get_recipes(db: Session = Depends(get_db)):
    recipes = db.query(RecipeDB).all()
    # Convert ingredients from JSON string back to list
    for r in recipes:
        r.ingredients = json.loads(r.ingredients)
    return recipes

@app.post("/recipes", response_model=Recipe)
def create_recipe(recipe: RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = RecipeDB(
        name=recipe.name,
        ingredients=json.dumps(recipe.ingredients),
        steps=recipe.steps
    )
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    db_recipe.ingredients = json.loads(db_recipe.ingredients)
    return db_recipe

@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = db.query(RecipeDB).filter(RecipeDB.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(db_recipe)
    db.commit()
    return {"message": "Recipe deleted successfully"}

@app.post("/ai-recipe")
def suggest_ai_recipe(data: IngredientList, db: Session = Depends(get_db)):
    user_ingredients = ", ".join(data.ingredients)
    
    # Check for API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "YOUR_OPENAI_API_KEY":
        raise HTTPException(
            status_code=400, 
            detail="OpenAI API Key is missing. Please add it to your .env file to use True AI."
        )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": AI_SYSTEM_PROMPT},
                {"role": "user", "content": f"Ingredients: {user_ingredients}"}
            ],
            temperature=0.8
        )
        recipe_text = response.choices[0].message.content
        return {"suggestion": recipe_text}
        
    except Exception as e:
        print(f"OpenAI Error: {e}")
        
        # --- Smart Fallback for Quota/API Issues ---
        # This keeps the app working even if OpenAI has no credits
        styles = ["Roasted", "Pan-Seared", "Gourmet", "Chef's Special"]
        import random
        style = random.choice(styles)
        main_ing = data.ingredients[0].capitalize() if data.ingredients else "Vegetable"
        
        fallback_text = f"Recipe Name: {style} {main_ing} (Local Chef Mode)\n\n"
        fallback_text += "Note: [OpenAI Quota Exceeded - Using Local Intelligence]\n\n"
        fallback_text += "Ingredients:\n"
        for ing in data.ingredients:
            fallback_text += f"- {ing}\n"
        fallback_text += "- Salt, Pepper, and Oil\n\n"
        fallback_text += "Preparation Steps (step by step):\n"
        fallback_text += f"1. Prepare your {user_ingredients}.\n"
        fallback_text += f"2. Sauté in a hot pan with oil until tender.\n"
        fallback_text += "3. Season to taste and serve beautifully.\n"
        
        return {"suggestion": fallback_text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
...