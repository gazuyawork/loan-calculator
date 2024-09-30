import React, { useState, useEffect } from 'react';
import './App.css';
import { loanTypes } from './LoanTypes';
import Decimal from 'decimal.js';

const App: React.FC = () => {
  // 入力値の状態管理
  const [loanType, setLoanType] = useState<string>('新築・長期優良住宅・子育て世代');
  const [borrowAmount, setBorrowAmount] = useState<number>(50000000);
  const [loanYears, setLoanYears] = useState<number>(35);
  const [interestRate, setInterestRate] = useState<number>(1);
  const [managementFee, setManagementFee] = useState<number>(0);
  const [repairReserve, setRepairReserve] = useState<number>(0);
  const [parkingFee, setParkingFee] = useState<number>(0);

  // 計算結果の状態管理
  const [totalDeduction, setTotalDeduction] = useState<number>(0);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalPaymentAfterDeduction, setTotalPaymentAfterDeduction] = useState<number>(0);

  // 年末残高と控除額の状態変数
  const [yearlyBalances, setYearlyBalances] = useState<{ year: number; balance: number; deduction: number | string }[]>([]);

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    const savedData = localStorage.getItem('mortgageData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setLoanType(data.loanType);
      setBorrowAmount(data.borrowAmount);
      setLoanYears(data.loanYears);
      setInterestRate(data.interestRate);
      setManagementFee(data.managementFee);
      setRepairReserve(data.repairReserve);
      setParkingFee(data.parkingFee);
    }
  }, []);

  // 入力値が変わるたびにローカルストレージに保存
  useEffect(() => {
    const data = {
      loanType,
      borrowAmount,
      loanYears,
      interestRate,
      managementFee,
      repairReserve,
      parkingFee,
    };
    localStorage.setItem('mortgageData', JSON.stringify(data));
  }, [loanType, borrowAmount, loanYears, interestRate, managementFee, repairReserve, parkingFee]);

  // 計算ロジック
  useEffect(() => {
    // Decimal.jsの精度設定
    Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

    // 月利計算
    const monthlyInterestRate = new Decimal(interestRate).dividedBy(100).dividedBy(12);
    const totalMonths = loanYears * 12;

    // 月々のローン支払額（元利均等返済方式）
    const onePlusR = new Decimal(1).plus(monthlyInterestRate);
    const numerator = monthlyInterestRate.mul(onePlusR.pow(totalMonths));
    const denominator = onePlusR.pow(totalMonths).minus(1);
    const monthlyLoanPaymentDecimal = new Decimal(borrowAmount).mul(numerator).dividedBy(denominator);

    setMonthlyPayment(monthlyLoanPaymentDecimal.toNumber());

    // 総支払額（ローン）
    const totalLoanPayment = monthlyLoanPaymentDecimal.mul(totalMonths);

    // 管理費等の月額合計
    const monthlyFees = new Decimal(managementFee).plus(repairReserve).plus(parkingFee);

    // 総支払額（ローン + 管理費等）
    const totalPaymentAmount = monthlyLoanPaymentDecimal.plus(monthlyFees).mul(totalMonths);
    setTotalPayment(totalPaymentAmount.toNumber());

    // 住宅ローンの控除額計算
    const { totalDeduction: calculatedTotalDeduction, yearlyData } = calculateTotalDeduction(
      borrowAmount,
      loanYears,
      interestRate,
      loanType,
      monthlyLoanPaymentDecimal
    );
    setTotalDeduction(calculatedTotalDeduction.toNumber());

    // 各年の年末残高と控除額を設定
    setYearlyBalances(yearlyData);

    // 総支払額（控除後）
    const totalAfterDeduction = totalPaymentAmount.minus(calculatedTotalDeduction);
    setTotalPaymentAfterDeduction(totalAfterDeduction.toNumber());
  }, [loanType, borrowAmount, loanYears, interestRate, managementFee, repairReserve, parkingFee]);

  // 住宅ローン控除額の計算関数
  const calculateTotalDeduction = (
    borrowAmount: number,
    loanYears: number,
    interestRate: number,
    loanType: string,
    monthlyLoanPayment: Decimal
  ): { totalDeduction: Decimal; yearlyData: { year: number; balance: number; deduction: number | string }[] } => {
    // 精度設定
    Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

    // 選択された控除の種類を取得
    const selectedLoanType = loanTypes.find((type) => type.name === loanType);
    if (!selectedLoanType)
      return {
        totalDeduction: new Decimal(0),
        yearlyData: [],
      };

    const borrowingLimit = new Decimal(selectedLoanType.borrowingLimit);
    const deductionYears = selectedLoanType.deductionYears;
    const deductionRate = new Decimal(selectedLoanType.deductionRate);

    // 年末残高の計算と控除額の累積
    let remainingBalance = new Decimal(borrowAmount);
    const monthlyInterestRate = new Decimal(interestRate).dividedBy(100).dividedBy(12);
    const totalMonths = loanYears * 12;

    let totalDeduction = new Decimal(0);
    let currentMonth = 0;

    const yearlyData = [];

    // 35年間の年末残高を表示
    for (let year = 1; year <= loanYears; year++) {
      // 1年間の月ごとの計算
      for (let month = 1; month <= 12; month++) {
        const interestPayment = remainingBalance.mul(monthlyInterestRate);
        const principalPayment = monthlyLoanPayment.minus(interestPayment);
        remainingBalance = remainingBalance.minus(principalPayment);
        currentMonth++;

        // すべての返済が完了したらループを抜ける
        if (currentMonth >= totalMonths) {
          break;
        }
      }

      // 年末残高を計算
      const yearEndBalance = remainingBalance;

      // 控除期間内（13年まで）かどうかを確認
      if (year <= deductionYears) {
        // 借入限度額と年末残高の小さい方を適用
        const applicableBalance = Decimal.min(yearEndBalance, borrowingLimit);

        // 年間控除額を計算
        const annualDeduction = applicableBalance.mul(deductionRate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

        // 合計控除額を計算
        totalDeduction = totalDeduction.plus(annualDeduction);

        // 年ごとのデータを保存
        yearlyData.push({
          year: year,
          balance: applicableBalance.toNumber(),
          deduction: annualDeduction.toNumber(),
        });
      } else {
        // 控除がない年は控除額を「-」にする
        yearlyData.push({
          year: year,
          balance: yearEndBalance.toNumber(),
          deduction: '-',
        });
      }

      // すべての返済が完了したらループを抜ける
      if (currentMonth >= totalMonths) {
        break;
      }
    }

    return { totalDeduction, yearlyData };
  };

  return (
    <div className="container">
      <h1>住宅ローン控除計算アプリケーション</h1>

      {/* 1行目：住宅ローンの控除の種類選択 */}
      <div className="input-row">
        <label>住宅ローンの控除の種類選択：</label>
        <select value={loanType} onChange={(e) => setLoanType(e.target.value)}>
          <option value="">選択してください</option>
          {loanTypes.map((type) => (
            <option key={type.name} value={type.name}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2~7行目：入力式 */}
      <div className="input-row">
        <label>借入金額：</label>
        <input
          type="number"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(Number(e.target.value))}
        />
      </div>
      <div className="input-row">
        <label>ローン年数：</label>
        <input
          type="number"
          value={loanYears}
          onChange={(e) => setLoanYears(Number(e.target.value))}
        />
      </div>
      <div className="input-row">
        <label>金利（%）：</label>
        <input
          type="number"
          value={interestRate}
          onChange={(e) => setInterestRate(Number(e.target.value))}
        />
      </div>
      <div className="input-row">
        <label>管理費：</label>
        <input
          type="number"
          value={managementFee}
          onChange={(e) => setManagementFee(Number(e.target.value))}
        />
      </div>
      <div className="input-row">
        <label>修繕積立金：</label>
        <input
          type="number"
          value={repairReserve}
          onChange={(e) => setRepairReserve(Number(e.target.value))}
        />
      </div>
      <div className="input-row">
        <label>駐車場代：</label>
        <input
          type="number"
          value={parkingFee}
          onChange={(e) => setParkingFee(Number(e.target.value))}
        />
      </div>

      {/* 8~11行目：計算結果表示 */}
      <div className="result-row">
        <label>住宅ローンの控除額（合計）：</label>
        <span>{Math.round(totalDeduction).toLocaleString()}円</span>
      </div>
      <div className="result-row">
        <label>ローン支払額（月）：</label>
        <span>{Math.round(monthlyPayment).toLocaleString()}円</span>
      </div>
      <div className="result-row">
        <label>総支払額：</label>
        <span>{Math.round(totalPayment).toLocaleString()}円</span>
      </div>
      <div className="result-row">
        <label>総支払額（控除後）：</label>
        <span>{Math.round(totalPaymentAfterDeduction).toLocaleString()}円</span>
      </div>

      {/* 年末残高と控除額の表示 */}
      <h2>年度ごとの年末残高と控除額</h2>
      <table>
        <thead>
          <tr>
            <th>年度</th>
            <th>年末残高（円）</th>
            <th>控除額（円）</th>
          </tr>
        </thead>
        <tbody>
          {yearlyBalances.map((data) => (
            <tr key={data.year}>
              <td>{data.year}</td>
              <td>{Math.round(data.balance).toLocaleString()}</td>
              <td>{typeof data.deduction === 'number' ? Math.round(data.deduction).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
