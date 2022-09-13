const numZeroes = parseInt(process.argv[2]);

const printZeroes = (n: number = numZeroes) => console.log(`${'0'.repeat(n)}`);

printZeroes();
