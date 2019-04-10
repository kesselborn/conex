lint:
	eslint --fix *.js
	res="${shell grep 'console.log' *.js}"; \
			echo "$${res}"; \
			test -z "$${res}"
