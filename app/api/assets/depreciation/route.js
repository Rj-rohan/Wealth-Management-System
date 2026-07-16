import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  const currentDate = new Date();
  
  const depreciatedAssets = db.assets
    .filter(a => a.type === 'physical' && a.status === 'active')
    .map(asset => {
      const purchaseDate = new Date(asset.purchaseDate);
      const monthsElapsed = (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 + (currentDate.getMonth() - purchaseDate.getMonth());
      
      let computedValue = asset.purchasePrice;
      
      if (monthsElapsed > 0 && asset.usefulLifeMonths > 0) {
        if (asset.depreciationMethod === 'straight-line') {
          const monthlyDepreciation = asset.purchasePrice / asset.usefulLifeMonths;
          computedValue = Math.max(0, asset.purchasePrice - (monthlyDepreciation * monthsElapsed));
        } else if (asset.depreciationMethod === 'declining-balance') {
          // Simplified declining balance: fixed rate per year (e.g., 20% annualized -> 1.66% per month)
          const rate = 2.0 / (asset.usefulLifeMonths / 12); // Double declining
          const monthlyRate = rate / 12;
          computedValue = asset.purchasePrice * Math.pow(1 - monthlyRate, monthsElapsed);
        }
      }
      
      return {
        id: asset.id,
        name: asset.name,
        originalValue: asset.purchasePrice,
        computedCurrentValue: Math.round(Math.max(0, computedValue)),
        monthsElapsed,
        usefulLifeMonths: asset.usefulLifeMonths
      };
    });

  return NextResponse.json(depreciatedAssets);
}
