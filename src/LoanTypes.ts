export interface LoanType {
    name: string;
    borrowingLimit: number;
    deductionYears: number;
    deductionRate: number;
  }
  
  export const loanTypes: LoanType[] = [
    {
      name: '新築・長期優良住宅・子育て世帯',
      borrowingLimit: 50000000,
      deductionYears: 13,
      deductionRate: 0.007, // 0.7%
    },
    {
      name: '新築・長期優良住宅・その他',
      borrowingLimit: 45000000,
      deductionYears: 13,
      deductionRate: 0.007,
    },
    {
      name: '新築・ZEH水準省エネ住宅・子育て世帯',
      borrowingLimit: 45000000,
      deductionYears: 13,
      deductionRate: 0.007,
    },
    {
      name: '新築・ZEH水準省エネ住宅・その他',
      borrowingLimit: 35000000,
      deductionYears: 13,
      deductionRate: 0.007,
    },
    {
      name: '新築・省エネ基準適合住宅・子育て世帯',
      borrowingLimit: 40000000,
      deductionYears: 13,
      deductionRate: 0.007,
    },
    {
      name: '新築・省エネ基準適合住宅・その他',
      borrowingLimit: 30000000,
      deductionYears: 13,
      deductionRate: 0.007,
    },
    {
      name: '既存住宅・長期優良住宅',
      borrowingLimit: 30000000,
      deductionYears: 10,
      deductionRate: 0.007,
    },
    {
      name: '既存住宅・その他',
      borrowingLimit: 20000000,
      deductionYears: 10,
      deductionRate: 0.007,
    },
  ];
  