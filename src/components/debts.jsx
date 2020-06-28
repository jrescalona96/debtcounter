import React, { Component } from "react";
import _ from "lodash";
import TotalDebt from "./totalDebt";
import DebtTable from "./debtTable";
import AddForm from "./addForm";
import LocaleForm from "./localeForm";
import * as locale from "../services/localeService";
import * as api from "../services/api";
import * as currency from "../services/currencyService";
import * as crud from "../services/crudService";
import { getCurrencyFormatter } from "../utils/formatter";
import DebtConversionTable from "./debtConversionTable";

class Debts extends Component {
  state = {
    debts: [],
    debtHistory: [],
    sortColumn: {},
    currentLocale: {},
    locales: [
      {
        _id: "",
        name: "Choose One",
      },
    ],
  };

  componentDidMount() {
    const data = api.getUserData();
    const debts = data.debts;
    const debtsHistory = data.debtHistory;
    const sortColumn = data.sortColumn;
    const currentLocale = data.currentLocale;
    const locales = [...this.state.locales, ...locale.getLocales()];
    this.setState({ debts, debtsHistory, sortColumn, locales, currentLocale });
  }

  handleAdd = (data) => {
    const debts = api.addDebt(data);
    this.setState({ debts });
  };

  handleSort = (sortColumn) => {
    api.setSortColumn(sortColumn);
    this.setState({ sortColumn });
  };

  handlePay = (data) => {
    const { debts, debtHistory } = api.payDebt(data);
    this.setState({ debts, debtHistory });
  };

  handleLocaleChange = async (languageCode) => {
    const { currentLocale, debts } = this.state;

    if (languageCode !== currentLocale.languageCode) {
      const newLocale = locale.getLocale(languageCode);
      const forex = await currency.getForexRate(
        newLocale.currency,
        currentLocale.currency
      );
      const newDebts = debts.map((item) => {
        item.balance = item.balance * forex;
        item.total = item.total * forex;
        return item;
      });

      this.setState({ currentLocale: newLocale, debts: newDebts });
      crud.setData("currentLocale", newLocale);
      crud.setData("debts", this.statedebts);
    }
  };

  handleDelete = (data) => {
    const debts = api.deleteDebt(data._id);
    this.setState({ debts });
  };

  mapToModelView = (data, currencyFormatter) => {
    return data.map((item) => ({
      _id: item._id,
      date: item.date,
      total: currencyFormatter.format(item.total),
      balance: currencyFormatter.format(item.balance),
      lender: item.lender,
      isPaid: item.isPaid,
    }));
  };

  getBalance = () => {
    const { debts } = this.state;
    return debts.reduce((total, item) => total + item.balance, 0);
  };

  getTotal = () => {
    const { debts, debtHistory } = this.state;
    const balance = debts.reduce((total, item) => total + item.total, 0);
    return debtHistory.reduce((total, item) => total + item.total, balance);
  };

  getPageData = () => {
    const { debts: remainingDebts, sortColumn, currentLocale } = this.state;
    // sort data
    const orderedDebts = _.orderBy(
      remainingDebts,
      [sortColumn.path],
      [sortColumn.order]
    );
    // get formatter
    const currencyFormatter = getCurrencyFormatter(currentLocale);
    // format data
    const debts = this.mapToModelView(orderedDebts, currencyFormatter);
    // get total balance
    const balance = this.getBalance();
    // get original total debt
    const total = this.getTotal();

    return { debts, balance, total, currencyFormatter };
  };

  render() {
    const { debts, total, balance, currencyFormatter } = this.getPageData();
    const { locales, currentLocale } = this.state;

    return (
      <React.Fragment>
        <div className="row sticky-top">
          <div className="col-12 col-lg-6">
            <DebtTable
              data={{ debts, total, balance }}
              currencyFormatter={currencyFormatter}
              onPay={(data) => this.handlePay(data)}
              onSort={(col) => this.handleSort(col)}
              onDelete={(col) => this.handleDelete(col)}
              sortColumn={this.state.sortColumn}
            />
            <div className="row">
              <div className="col-12 col-md-6">
                <AddForm onAdd={(data) => this.handleAdd(data)} />
              </div>
              <div className="col-12 col-md-6">
                <LocaleForm
                  locales={locales}
                  currentLocale={currentLocale}
                  onLocaleChange={this.handleLocaleChange}
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <DebtConversionTable
              locales={locales}
              total={total}
              currentLocale={currentLocale}
            />
          </div>
        </div>
        <div className="mx-auto">
          <TotalDebt
            total={total}
            balance={balance}
            currencyFormatter={currencyFormatter}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default Debts;
