"use client";
import React from "react";

interface CategoryFilterProps {
  categories: string[];
  subCategories: string[];
  selectedCategory: string;
  selectedSubCategory: string;
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (subCategory: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  subCategories,
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Categories */}
      <div className="flex overflow-x-auto pb-4 pt-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap gap-3 scrollbar-hide snap-x snap-mandatory">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`snap-start shrink-0 whitespace-nowrap px-5 py-2 md:py-2.5 rounded-2xl text-sm font-black transition-all border-2 active:translate-y-0.5 active:shadow-none ${
              selectedCategory === category
                ? "bg-teal-400 text-white border-teal-600 shadow-[0_4px_0_0_#0d9488]"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 shadow-[0_4px_0_0_#e2e8f0]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Sub Categories */}
      {subCategories && subCategories.length > 0 && (
        <div className="flex overflow-x-auto pb-4 pt-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap gap-3 scrollbar-hide snap-x snap-mandatory">
          {subCategories.map((subCategory) => (
            <button
              key={subCategory}
              onClick={() => onSubCategoryChange(subCategory)}
              className={`snap-start shrink-0 whitespace-nowrap px-5 py-2 md:py-2.5 rounded-2xl text-sm font-black transition-all border-2 active:translate-y-0.5 active:shadow-none ${
                selectedSubCategory === subCategory
                  ? "bg-teal-400 text-white border-teal-600 shadow-[0_4px_0_0_#0d9488]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 shadow-[0_4px_0_0_#e2e8f0]"
              }`}
            >
              {subCategory}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
