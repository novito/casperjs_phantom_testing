page = require('webpage').create();

page.onConsoleMessage = function (msg) { console.log(msg) }

page.open('prova.html', (function (status) {
	if (status != 'success') {
		console.log('Fail on loading the site');
	} else {
		page.evaluate(function () { 
			var images = document.getElementsByTagName('img');

			var top_offset = 1000;
			var potential_logo;
			for (var i=0; i < images.length; i++) {
				if (images[i].getBoundingClientRect().top < top_offset) {
					potential_logo = images[i];
					top_offset = images[i].getBoundingClientRect().top;
				}
			}

			console.log("Top offset image is");
			console.log(potential_logo.id);
			return 0;
		});
	}
phantom.exit();
}));
