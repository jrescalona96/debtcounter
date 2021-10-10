import http from "./httpService";

const baseUrl = "https://api.exchangeratesapi.io/latest";

export const getForexRate = async (symbol, base) => {
	const url = `${baseUrl}?base=${base}&symbols=${symbol}`;
	const { data } = await http.get(url);
	return data.rates[symbol];
};

export const getAllForexRates = async (base) => {
	const url = `${baseUrl}?base=${base}`;
	const { data } = await http.get(url);
	return data;
};

export default { getForexRate, getAllForexRates };
