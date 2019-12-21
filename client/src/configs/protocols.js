const protocols = {
  bzx:{
    name: "Fulcrum",
    pos: 2,
    fee: 0,
    icon: 'images/fulcrum-mark.svg',
    color: 'hsl(197, 98%, 38%)',
    defiScore: {
      risk:{"score":"6.8","liquidityIndex":"0.521276252998268","collateralIndex":"0.5543330931931882","isOpenSource":true,"isAudited":true,"isFormallyVerified":false,"isRegulated":false},
      supplyVolume: "868554.4810829365",
      tvl:"507141.45506271656"
    }
  },
	compound: {
		enabled:true,
		name: 'Compound',
		pos: 1,
		fee: 0,
		icon: 'images/compound-mark-green.png',
		color: 'hsl(162, 100%, 41%)',
		defiScore: {
      risk:{"score":"7.8","liquidityIndex":"0.8083880417969935","collateralIndex":"0.7042550662548455","isOpenSource":true,"isAudited":true,"isFormallyVerified":true,"isRegulated":false},
      supplyVolume: "10026182.946188034",
      tvl:"7447743.460741416"
		}
	},
  dydx:{
    name: "DyDx",
    pos: 2,
    fee: 0,
    icon: 'images/dydx-mark.svg',
    color: 'hsl(197, 98%, 38%)',
    defiScore: {
      token:'dai',
      risk:{"score":"6.6","liquidityIndex":"0.6584594346162754","collateralIndex":"0.36646014454068054","isOpenSource":true,"isAudited":true,"isFormallyVerified":false,"isRegulated":false},
      supplyVolume: "4362004.004327111",
      tvl:"2056271.0656262077"
    }
  }
}
export default protocols;