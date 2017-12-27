describe('start', function() {
	
  it('shows list of stations and years', function() {
   
	  browser.get('http://localhost:1337');
   
	  expect(element.all(by.repeater('stat in $ctrl.myScope.data.stats.stats')).count()).toBeGreaterThan(1);
	  expect(element.all(by.repeater('y in $ctrl.myScope.jahre')).count()).toBeGreaterThan(0);
   
	  var select = element(by.model('$ctrl.myScope.data.stats.stat'));
	  select.$('[value="01420"]').click();

	  expect(element.all(by.repeater('y in $ctrl.myScope.jahre')).count()).toBeGreaterThan(10);

	  // check Auswahl list (latest 8 entries)
	  expect(element.all(by.repeater('tagwert in $ctrl.data.list')).count()).toEqual(8);
	  
  });
  
  it('shows diagram of months', function() {
	   
	  browser.get('http://localhost:1337');
     
	  var select = element(by.model('$ctrl.myScope.data.stats.stat'));
	  select.$('[value="04928"]').click();

	  var select = element(by.model('$ctrl.myScope.data.jahr'));
	  select.$('[value="2017"]').click();

	  element(by.id('yt')).click();	  // temperature, months of the year: 12 plus 1 tick at the end gives 13 ticks
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(13);
	  expect(element.all(by.tagName('h2')).get(1).getText()).toContain('Jahresverlauf');

	  element(by.id('yw')).click(); // wind	  
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(13);

	  element(by.id('si')).click();	 // precipitation
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(13);

	  element(by.id('yp')).click();	 // pressure 
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(13);

	  expect(element.all(by.tagName('h2')).get(1).getText()).toContain('Jahresverlauf');

	  element(by.id('sl')).click(); // list
	  
	  expect(element.all(by.repeater('monat in $ctrl.data.list')).count()).toEqual(12);
	  
	  
  });
  
  it('shows diagram of days', function() {
	   
	  browser.get('http://localhost:1337');
     
	  var select = element(by.model('$ctrl.myScope.data.stats.stat'));
	  select.$('[value="04928"]').click();

	  var select = element(by.model('$ctrl.myScope.data.jahr'));
	  select.$('[value="2016"]').click();

	  element(by.id('yp')).click();	  // start with pressure	  
	  
	  element.all(by.repeater('t in $ctrl.data.link')).get(6).click(); // July: 31 days plus 1 gives 32
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(32);

	  element(by.id('sw')).click();	  // wind
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(32);

	  element(by.id('si')).click();	  // precipitation
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(32);

	  element(by.id('st')).click();	  // temperature
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(32);
	  expect(element.all(by.tagName('h2')).get(1).getText()).toContain('Monatsverlauf');

	  element(by.id('sl')).click();
	  
	  expect(element.all(by.repeater('tagwert in $ctrl.data.list')).count()).toEqual(31);
	  expect(element.all(by.tagName('h2')).get(1).getText()).toContain('Monat');

  });
  
  
  it('shows diagram of hours', function() {
	   
	  browser.get('http://localhost:1337');
     
	  var select = element(by.model('$ctrl.myScope.data.stats.stat'));
	  select.$('[value="04928"]').click();

	  var select = element(by.model('$ctrl.myScope.data.jahr'));
	  select.$('[value="2016"]').click();

	  element(by.id('yi')).click();	  
	  
	  element.all(by.repeater('t in $ctrl.data.link')).get(6).click(); 
	  
	  element.all(by.repeater('t in $ctrl.data.link')).get(19).click();  // July, 20th 
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(25);

	  element(by.id('sw')).click();	  
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(25);

	  element(by.id('st')).click();	  
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(25);
	  expect(element.all(by.tagName('h2')).get(1).getText()).toContain('Tagesverlauf');

	  element(by.id('sp')).click();	  
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(25);

	  element(by.id('sl')).click();
	  
	  expect(element.all(by.repeater('tagwert in $ctrl.data.list')).count()).toEqual(24);
	  expect(element.all(by.tagName('h2')).get(1).getText()).toContain('Tagesverlauf');
	  
  });
  
  it('navigation down and up', function() {
	   
	  browser.get('http://localhost:1337');
     
	  var select = element(by.model('$ctrl.myScope.data.stats.stat'));
	  select.$('[value="04928"]').click();

	  var select = element(by.model('$ctrl.myScope.data.jahr'));
	  select.$('[value="2016"]').click();

	  element(by.id('yi')).click();	  
	  
	  element.all(by.repeater('t in $ctrl.data.link')).get(6).click(); 
	  
	  element.all(by.repeater('t in $ctrl.data.link')).get(19).click();  // July, 20th   


	  element(by.id('st')).click(); // temp, hours	  

	  element(by.id('ttp')).click(); // next day
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(25);
	  
	  element(by.id('ttl')).click(); // previous day
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(25);
	  
	  element(by.id('sp')).click(); // pres, hours	
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(25);
	  
	  expect(element.all(by.tagName('h2')).get(1).getText()).toContain('Tagesverlauf');
	  
	  element(by.id('tp3')).click(); 
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(25);
	  
	  expect(element.all(by.tagName('h2')).get(1).getText()).toContain('dreier');
	  
	  element(by.id('tpm')).click();
	  
	  expect(element.all(by.tagName('h2')).get(1).getText()).toContain('Monatsverlauf');
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(32);
	  
	  element(by.id('tpl')).click(); // June
	  
	  expect(element.all(by.repeater('x in $ctrl.data.gridXPath')).count()).toEqual(31);
	  
  });
  
  
  
  
  
});