export const numToByteArray = (n: number): number[] => {
    n = n & 0xffff;
    return [n & 0xff, (n >> 8) & 0xff];
};