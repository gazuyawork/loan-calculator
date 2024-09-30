import React, { useState, useEffect } from 'react';
import './App.css';
import { loanTypes } from './LoanTypes';
import Decimal from 'decimal.js';

const App: React.FC = () => {
  // 入力値の状態管理（セット1）
  const [loanType1, setLoanType1] = useState<string>('新築・長期優良住宅・子育て世代');
  const [borrowAmount1, setBorrowAmount1] = useState<number>(50000000);
  const [loanYears1, setLoanYears1] = useState<number>(35);
  const [interestRate1, setInterestRate1] = useState<number>(1);
  const [managementFee1, setManagementFee1] = useState<number>(0);
  const [repairReserve1, setRepairReserve1] = useState<number>(0);
  const [parkingFee1, setParkingFee1] = useState<number>(0);

  // 入力値の状態管理（セット2）
  const [loanType2, setLoanType2] = useState<string>('新築・長期優良住宅・子育て世代');
  const [borrowAmount2, setBorrowAmount2] = useState<number>(30000000);
  const [loanYears2, setLoanYears2] = useState<number>(25);
  const [interestRate2, setInterestRate2] = useState<number>(1.5);
  const [managementFee2, setManagementFee2] = useState<number>(0);
  const [repairReserve2, setRepairReserve2] = useState<number>(0);
  const [parkingFee2, setParkingFee2] = useState<number>(0);

  // 計算結果の状態管理
  const [totalPayment1, setTotalPayment1] = useState<number>(0);
  const [totalPayment2, setTotalPayment2] = useState<number>(0);
  const [monthlyPayment1, setMonthlyPayment1] = useState<number>(0);
  const [monthlyPayment2, setMonthlyPayment2] = useState<number>(0);
  const [totalDeduction1, setTotalDeduction1] = useState<number>(0);
  const [totalDeduction2, setTotalDeduction2] = useState<number>(0);
  const [totalPaymentAfterDeduction1, setTotalPaymentAfterDeduction1] = useState<number>(0);
  const [totalPaymentAfterDeduction2, setTotalPaymentAfterDeduction2] = useState<number>(0);
  const [yearlyBalances1, setYearlyBalances1] = useState<{ year: number; balance: number; deduction: number }[]>([]);
  const [yearlyBalances2, setYearlyBalances2] = useState<{ year: number; balance: number; deduction: number }[]>([]);

  // 差額の状態管理
  const [monthlyDifference, setMonthlyDifference] = useState<number>(0);
  const [totalDifference, setTotalDifference] = useState<number>(0);
  const [deductionDifference, setDeductionDifference] = useState<number>(0);
  const [totalAfterDeductionDifference, setTotalAfterDeductionDifference] = useState<number>(0);

  // 住宅ローン控除額の計算関数
  const calculateTotalDeduction = (
    borrowAmount: number,
    loanYears: number,
    interestRate: number,
    loanType: string
  ): { totalDeduction: number; yearlyData: { year: number; balance: number; deduction: number }[] } => {
    Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

    const selectedLoanType = loanTypes.find((type) => type.name === loanType);
    if (!selectedLoanType) return { totalDeduction: 0, yearlyData: [] };

    const borrowingLimit = new Decimal(selectedLoanType.borrowingLimit);
    const deductionYears = selectedLoanType.deductionYears;
    const deductionRate = new Decimal(selectedLoanType.deductionRate);

    let remainingBalance = new Decimal(borrowAmount);
    const monthlyInterestRate = new Decimal(interestRate).dividedBy(100).dividedBy(12);
    const totalMonths = loanYears * 12;

    let totalDeduction = new Decimal(0);
    let currentMonth = 0;
    const yearlyData = [];

    for (let year = 1; year <= loanYears; year++) {
      for (let month = 1; month <= 12; month++) {
        const interestPayment = remainingBalance.mul(monthlyInterestRate);
        const principalPayment = new Decimal(borrowAmount).div(totalMonths).minus(interestPayment);
        remainingBalance = remainingBalance.minus(principalPayment);
        currentMonth++;
        if (currentMonth >= totalMonths) break;
      }

      const yearEndBalance = remainingBalance;

      if (year <= deductionYears) {
        const applicableBalance = Decimal.min(yearEndBalance, borrowingLimit);
        const annualDeduction = applicableBalance.mul(deductionRate).toNumber();
        totalDeduction = totalDeduction.plus(annualDeduction);
        yearlyData.push({ year, balance: yearEndBalance.toNumber(), deduction: annualDeduction });
      } else {
        yearlyData.push({ year, balance: yearEndBalance.toNumber(), deduction: 0 });
      }

      if (currentMonth >= totalMonths) break;
    }

    return { totalDeduction: totalDeduction.toNumber(), yearlyData };
  };

  // 計算ロジック
  useEffect(() => {
    Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

    const calcLoanPayment = (borrowAmount: number, loanYears: number, interestRate: number) => {
      const monthlyInterestRate = new Decimal(interestRate).dividedBy(100).dividedBy(12);
      const totalMonths = loanYears * 12;
      const onePlusR = new Decimal(1).plus(monthlyInterestRate);
      const numerator = monthlyInterestRate.mul(onePlusR.pow(totalMonths));
      const denominator = onePlusR.pow(totalMonths).minus(1);
      return new Decimal(borrowAmount).mul(numerator).dividedBy(denominator);
    };

    // セット1の計算
    const monthlyLoanPayment1 = calcLoanPayment(borrowAmount1, loanYears1, interestRate1);
    setMonthlyPayment1(monthlyLoanPayment1.toNumber());
    const totalLoanPayment1 = monthlyLoanPayment1.mul(loanYears1 * 12);
    const monthlyFees1 = new Decimal(managementFee1).plus(repairReserve1).plus(parkingFee1);
    const totalPaymentAmount1 = monthlyLoanPayment1.plus(monthlyFees1).mul(loanYears1 * 12);
    setTotalPayment1(totalPaymentAmount1.toNumber());

    const { totalDeduction: totalDeduction1, yearlyData: yearlyBalances1 } = calculateTotalDeduction(
      borrowAmount1,
      loanYears1,
      interestRate1,
      loanType1
    );
    setTotalDeduction1(totalDeduction1);
    setYearlyBalances1(yearlyBalances1);

    const totalAfterDeduction1 = totalPaymentAmount1.minus(totalDeduction1);
    setTotalPaymentAfterDeduction1(totalAfterDeduction1.toNumber());

    // セット2の計算
    const monthlyLoanPayment2 = calcLoanPayment(borrowAmount2, loanYears2, interestRate2);
    setMonthlyPayment2(monthlyLoanPayment2.toNumber());
    const totalLoanPayment2 = monthlyLoanPayment2.mul(loanYears2 * 12);
    const monthlyFees2 = new Decimal(managementFee2).plus(repairReserve2).plus(parkingFee2);
    const totalPaymentAmount2 = monthlyLoanPayment2.plus(monthlyFees2).mul(loanYears2 * 12);
    setTotalPayment2(totalPaymentAmount2.toNumber());

    const { totalDeduction: totalDeduction2, yearlyData: yearlyBalances2 } = calculateTotalDeduction(
      borrowAmount2,
      loanYears2,
      interestRate2,
      loanType2
    );
    setTotalDeduction2(totalDeduction2);
    setYearlyBalances2(yearlyBalances2);

    const totalAfterDeduction2 = totalPaymentAmount2.minus(totalDeduction2);
    setTotalPaymentAfterDeduction2(totalAfterDeduction2.toNumber());

    // 差額の計算
    setMonthlyDifference(monthlyLoanPayment1.minus(monthlyLoanPayment2).toNumber());
    setTotalDifference(totalPaymentAmount1.minus(totalPaymentAmount2).toNumber());
    setDeductionDifference(totalDeduction1 - totalDeduction2);
    setTotalAfterDeductionDifference(totalAfterDeduction1.minus(totalAfterDeduction2).toNumber());
  }, [
    loanType1,
    borrowAmount1,
    loanYears1,
    interestRate1,
    managementFee1,
    repairReserve1,
    parkingFee1,
    loanType2,
    borrowAmount2,
    loanYears2,
    interestRate2,
    managementFee2,
    repairReserve2,
    parkingFee2,
  ]);

  return (
    <div className="container">
      <h1>住宅ローン比較計算アプリケーション</h1>

      <div className="row">
        {/* 1列目：項目名 */}
        <div className="column">
          <div className="input-row"><label>控除内容：</label></div>
          <div className="input-row"><label>借入金額：</label></div>
          <div className="input-row"><label>ローン年数：</label></div>
          <div className="input-row"><label>金利（%）：</label></div>
          <div className="input-row"><label>管理費：</label></div>
          <div className="input-row"><label>修繕積立金：</label></div>
          <div className="input-row"><label>駐車場代：</label></div>
          <div className="result-row"><label>月々の支払額：</label></div>
          <div className="result-row"><label>総支払額：</label></div>
          <div className="result-row"><label>控除額：</label></div>
          <div className="result-row"><label>控除後の総支払額：</label></div>
        </div>

        {/* 2列目：セット1の入力フィールド */}
        <div className="column">
          <div className="input-row">
            <select value={loanType1} onChange={(e) => setLoanType1(e.target.value)}>
              {loanTypes.map((type) => (
                <option key={type.name} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="input-row">
            <input type="number" value={borrowAmount1} onChange={(e) => setBorrowAmount1(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={loanYears1} onChange={(e) => setLoanYears1(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={interestRate1} onChange={(e) => setInterestRate1(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={managementFee1} onChange={(e) => setManagementFee1(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={repairReserve1} onChange={(e) => setRepairReserve1(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={parkingFee1} onChange={(e) => setParkingFee1(Number(e.target.value))} />
          </div>

          <div className="result-row"><span>{Math.round(monthlyPayment1).toLocaleString()}円</span></div>
          <div className="result-row"><span>{Math.round(totalPayment1).toLocaleString()}円</span></div>
          <div className="result-row"><span>{Math.round(totalDeduction1).toLocaleString()}円</span></div>
          <div className="result-row"><span>{Math.round(totalPaymentAfterDeduction1).toLocaleString()}円</span></div>
        </div>

        {/* 3列目：セット2の入力フィールド */}
        <div className="column">
          <div className="input-row">
            <select value={loanType2} onChange={(e) => setLoanType2(e.target.value)}>
              {loanTypes.map((type) => (
                <option key={type.name} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="input-row">
            <input type="number" value={borrowAmount2} onChange={(e) => setBorrowAmount2(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={loanYears2} onChange={(e) => setLoanYears2(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={interestRate2} onChange={(e) => setInterestRate2(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={managementFee2} onChange={(e) => setManagementFee2(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={repairReserve2} onChange={(e) => setRepairReserve2(Number(e.target.value))} />
          </div>

          <div className="input-row">
            <input type="number" value={parkingFee2} onChange={(e) => setParkingFee2(Number(e.target.value))} />
          </div>

          <div className="result-row"><span>{Math.round(monthlyPayment2).toLocaleString()}円</span></div>
          <div className="result-row"><span>{Math.round(totalPayment2).toLocaleString()}円</span></div>
          <div className="result-row"><span>{Math.round(totalDeduction2).toLocaleString()}円</span></div>
          <div className="result-row"><span>{Math.round(totalPaymentAfterDeduction2).toLocaleString()}円</span></div>
        </div>

        {/* 4列目：差額表示 */}
        <div className="column">
          <div className="input-row"><input type="number" style={{ display: 'none' }} /></div>
          <div className="input-row"><input type="number" style={{ display: 'none' }} /></div>
          <div className="input-row"><input type="number" style={{ display: 'none' }} /></div>
          <div className="input-row"><input type="number" style={{ display: 'none' }} /></div>
          <div className="input-row"><input type="number" style={{ display: 'none' }} /></div>
          <div className="input-row"><input type="number" style={{ display: 'none' }} /></div>          <div className="input-row"><input type="number" style={{ display: 'none' }} /></div>

          <div className="result-row"><span className="difference">{Math.round(monthlyDifference).toLocaleString()}円</span></div>
          <div className="result-row"><span className="difference">{Math.round(totalDifference).toLocaleString()}円</span></div>
          <div className="result-row"><span className="difference">{Math.round(deductionDifference).toLocaleString()}円</span></div>
          <div className="result-row"><span className="difference">{Math.round(totalAfterDeductionDifference).toLocaleString()}円</span></div>
        </div>
      </div>

      {/* 年末残高の推移表示 */}
      {/* <h2>年末残高の推移</h2>
      <table>
        <thead>
          <tr>
            <th>年度</th>
            <th>セット1 年末残高（円）</th>
            <th>セット1 控除額（円）</th>
            <th>セット2 年末残高（円）</th>
            <th>セット2 控除額（円）</th>
          </tr>
        </thead>
        <tbody>
          {yearlyBalances1.map((data1, index) => {
            const data2 = yearlyBalances2[index] || { year: '', balance: 0, deduction: 0 };
            return (
              <tr key={data1.year}>
                <td>{data1.year}</td>
                <td>{Math.round(data1.balance).toLocaleString()}</td>
                <td>{Math.round(data1.deduction).toLocaleString()}</td>
                <td>{Math.round(data2.balance).toLocaleString()}</td>
                <td>{Math.round(data2.deduction).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table> */}
    </div>
  );
};

export default App;
