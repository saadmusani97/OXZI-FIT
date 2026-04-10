import { MealGrade, MealGradeResult } from '../types/database'

export function calculateMealGrade(calories: number, protein_g: number, fat_g: number): MealGradeResult {
  if (calories <= 0) return { grade: 'D', proteinRatio: 0, fatRatio: 0 }
  const proteinRatio = protein_g / calories
  const fatRatio = fat_g / calories
  let grade: MealGrade
  if (proteinRatio >= 0.15 && fatRatio <= 0.25) grade = 'A+'
  else if (proteinRatio >= 0.12 && fatRatio <= 0.30) grade = 'A'
  else if (proteinRatio >= 0.08 && fatRatio <= 0.40) grade = 'B'
  else if (proteinRatio >= 0.05 || fatRatio <= 0.50) grade = 'C'
  else grade = 'D'
  return { grade, proteinRatio, fatRatio }
}
