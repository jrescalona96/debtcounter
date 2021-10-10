import React, { Component } from "react";
import _ from "lodash";
import TotalDebt from "./totalDebt";
import DebtTable from "./debtTable";
import AddForm from "./addForm";
import LocaleForm from "./localeForm";
import * as locale from "../services/localeService";
import * as api from "../services/api";
import * as currency from "../services/currencyService";
import { getCurrencyFormatter } from "../utils/formatter";
import DebtConversionTable from "./debtConversionTable";

class Debts extends Component {
	state = {
		debts: [],
		debtHistory: [],
		sortColumn: {},
		currentLocale: {},
		locales: [],
		forexRates: [],
		convertedTotals: [],
	};

	componentDidMount() {
		const data = api.getUserData();
		const debts = data.debts;
		const debtsHistory = data.debtHistory;
		const sortColumn = data.sortColumn;
		const currentLocale = data.currentLocale;
		const locales = locale.getLocales();

		const rates = currency.getAllForexRates(currentLocale.currency);
		rates.then((value) => {
			const forexRates = value["rates"];
			this.setState({ forexRates });
		});

		this.setState({
			debts,
			debtsHistory,
			sortColumn,
			locales,
			currentLocale,
		});
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

			const data = { locale: newLocale, debts: newDebts };
			api.updateLocale(data);
			this.setState({ currentLocale: newLocale, debts: newDebts });
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

	getPreviousBalance = () => {
		const { debtHistory } = this.state;

		const balance = this.getBalance();
		const lastIndex = debtHistory.length - 1;
		let lastPayment = 0;
		if (lastIndex >= 0) lastPayment = debtHistory[lastIndex].balance;

		return balance + lastPayment;
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

	getConvertedTotalList = (amount, locales) => {
		const { forexRates } = this.state;
		return locales.map((loc) => {
			const rate = _.get(forexRates, loc.currency);
			const country = loc.name;
			const total = rate * amount;
			const _id = loc._id;
			return { _id, total, country };
		});
	};

	getPageData = () => {
		const {
			debts: remainingDebts,
			sortColumn,
			currentLocale,
			locales: allLocales,
		} = this.state;

		// append "choose one" option to locales
		const locales = [
			...[
				{
					_id: "",
					name: "Choose Locale",
				},
			],
			...allLocales,
		];

		// sort data
		const orderedDebts = _.orderBy(
			remainingDebts,
			[sortColumn.path],
			[sortColumn.order]
		);

		const currencyFormatter = getCurrencyFormatter(currentLocale);
		const debts = this.mapToModelView(orderedDebts, currencyFormatter);
		const balance = this.getBalance();
		const convertedTotalList = this.getConvertedTotalList(balance, locales);
		const total = this.getTotal();
		const previousBalance = this.getPreviousBalance();

		return {
			debts,
			balance,
			total,
			currencyFormatter,
			locales,
			convertedTotalList,
			previousBalance,
		};
	};

	render() {
		const {
			debts,
			total,
			balance,
			currencyFormatter,
			convertedTotalList,
			locales,
			previousBalance,
		} = this.getPageData();
		const { currentLocale } = this.state;
		const { theme } = this.props;

		return (
			<React.Fragment>
				<AddForm onAdd={(data) => this.handleAdd(data)} theme={theme} />
				{/* not available due to API Key restrictions */}
				{/* <LocaleForm
					locales={locales}
					currentLocale={currentLocale}
					onLocaleChange={this.handleLocaleChange}
					theme={theme}
				/> */}

				<DebtTable
					data={{ debts, total, balance }}
					currencyFormatter={currencyFormatter}
					onPay={(data) => this.handlePay(data)}
					onSort={(col) => this.handleSort(col)}
					onDelete={(col) => this.handleDelete(col)}
					sortColumn={this.state.sortColumn}
					theme={theme}
				/>
				<TotalDebt
					total={total}
					previousBalance={previousBalance}
					balance={balance}
					currencyFormatter={currencyFormatter}
					theme={theme}
				/>
				{/* not available due to API Key restrictions */}
				{/* <DebtConversionTable
          data={convertedTotalList}
          locales={locales}
          balance={balance}
          theme={theme}
        /> */}
			</React.Fragment>
		);
	}
}

export default Debts;
