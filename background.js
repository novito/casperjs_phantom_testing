page = require('webpage').create();

page.onConsoleMessage = function (msg) { console.log(msg) }

page.open('http://www.google.es', (function (status) {
	if (status != 'success') {
		console.log('Fail on loading the site');
	} else {
		page.evaluate(function () { 
			var all = document.getElementsByTagName("div");
			for (var i=0, max=all.length; i < max; i++) {
				if (all[i].getBoundingClientRect().top < 100) {
					console.log(window.getComputedStyle(all[i]).backgroundImage);
				}
			}
			/* Iterate over all elements */
			return 0;
		});
	}
phantom.exit();
}));
