(() => {

	'use strict'

	const YEAR = '2014'

	const CURRENCY = 'USD'

	const CURRENCY_KEY = 'kurs_sredni'

	const CURRENCIES_KEY = 'pozycja'

	const parser = new DOMParser()

	const getCurrency = (currenciesXml, code) => {
		return [].slice.call(parser.parseFromString(currenciesXml, 'text/xml').getElementsByTagName(CURRENCIES_KEY))
			.map((element) => {
				return [].slice.call(element.childNodes)
					.map((node) => ({
						name: node.nodeName,
						value: node.innerHTML
					}))
					.reduce((previous, current) => {
						previous[current.name] = current.value
						return previous;
					}, {})

			})
			.filter((currency) => currency.kod_waluty === code)
			.pop()
	}

	const validateEntry = (entry) => /^a\d{3}z/.test(entry)

	const fetchEntry = (entry) => {
		return fetch(`http://www.nbp.pl/kursy/xml/${entry}.xml`)
			.then((response) => response.text())
	}

	const getDateString = (name) => {
		return name.substr(name.length - 4, 2) + '/' + name.substr(name.length - 2, 2) + '/' + (parseInt(name.substr(name.length - 6, 2), 10) + 2000);
	}

	fetch(`http://www.nbp.pl/kursy/xml/dir${YEAR}.txt`)
	.then((response) => response.text())
	.then((text) => {
		return Promise.all(
			text
				.split('\n')
				.map((entry) => entry.trim())
				.filter(validateEntry)
				.map((entry) => fetchEntry(entry)
					.then((currenciesXml) => ({
						entry: entry,
						data: getCurrency(currenciesXml, CURRENCY)
					}))
				)
			)
	})
	.then((results) => {
		console.log(JSON.stringify(results
			.reduce((previous, current) => {
				previous[getDateString(current.entry)] = Number(current.data[CURRENCY_KEY].replace(',', '.'))
				return previous
			}, {})
		))
	})
	.catch((error) => console.log('ups!, ' + error))
})()