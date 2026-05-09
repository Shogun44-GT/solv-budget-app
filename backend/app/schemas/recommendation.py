from pydantic import BaseModel
from typing import Optional


class AlternativeRead(BaseModel):
    label: str
    saving_euros: int
    saving_min: Optional[int] = None
    saving_max: Optional[int] = None
    description: str
    effort: str
    url: Optional[str] = None


class RecommendationSet(BaseModel):
    """Ensemble de recommandations pour toutes les catégories à risque."""
    categories: dict[str, list[AlternativeRead]]
    profile: str
    total_potential_saving: int


class MealPrepRecipe(BaseModel):
    name: str
    cost_per_portion: float
    portions: int
    prep_time: str
    ingredients: list[str]
    difficulty: str
    tags: list[str]


class NotificationRead(BaseModel):
    id: str
    title: str
    body: str
    urgency: str
    action: Optional[str]
    is_read: bool
    created_at: str

    model_config = {"from_attributes": True}
