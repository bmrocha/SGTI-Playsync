import { format } from 'date-fns';

export interface Holiday {
    date: string;
    name: string;
}

export const getMovableHolidays = (y: number): Holiday[] => {
    const f = Math.floor;
    const G = y % 19;
    const C = f(y / 100);
    const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
    const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
    const J = (y + f(y / 4) + I + 2 - C + f(C / 4)) % 7;
    const L = I - J;
    const month = 3 + f((L + 40) / 44);
    const day = L + 28 - 31 * f(month / 4);
    const easter = new Date(y, month - 1, day);

    const addDays = (d: Date, n: number) => {
        const result = new Date(d);
        result.setDate(result.getDate() + n);
        return result;
    };

    const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');

    return [
        { date: formatDate(addDays(easter, -47)), name: 'Carnaval' },
        { date: formatDate(addDays(easter, -2)), name: 'Sexta-feira Santa' },
        { date: formatDate(easter), name: 'Páscoa' },
        { date: formatDate(addDays(easter, 60)), name: 'Corpus Christi' },
    ];
};

export const getNthSunday = (year: number, month: number, nth: number): string => {
    const date = new Date(year, month, 1);
    const sundays = [];
    while (date.getMonth() === month) {
        if (date.getDay() === 0) sundays.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return sundays[nth - 1] ? format(sundays[nth - 1], 'yyyy-MM-dd') : '';
};

export const getBrazilianHolidays = (y: number): Holiday[] => {
    const fixed = [
        { date: `${y}-01-01`, name: 'Ano Novo' },
        { date: `${y}-03-19`, name: 'São José' },
        { date: `${y}-04-21`, name: 'Tiradentes' },
        { date: `${y}-05-01`, name: 'Dia do Trabalho' },
        { date: `${y}-06-12`, name: 'Dia dos Namorados' },
        { date: `${y}-06-13`, name: 'Santo Antônio' },
        { date: `${y}-06-24`, name: 'São João' },
        { date: `${y}-06-29`, name: 'São Pedro' },
        { date: `${y}-09-07`, name: 'Independência' },
        { date: `${y}-10-12`, name: 'Nossa Sra. Aparecida' },
        { date: `${y}-10-15`, name: 'Dia do Professor' },
        { date: `${y}-11-02`, name: 'Finados' },
        { date: `${y}-11-15`, name: 'Proclamação República' },
        { date: `${y}-11-20`, name: 'Consciência Negra' },
        { date: `${y}-12-08`, name: 'Nossa Sra. Conceição' },
        { date: `${y}-12-13`, name: 'Santa Luzia' },
        { date: `${y}-12-24`, name: 'Véspera de Natal' },
        { date: `${y}-12-25`, name: 'Natal' },
        { date: `${y}-12-31`, name: 'Véspera de Ano Novo' },
    ];

    const special = [
        { date: `${y}-03-08`, name: 'Dia da Mulher' },
        ...(getNthSunday(y, 4, 2) ? [{ date: getNthSunday(y, 4, 2), name: 'Dia das Mães' }] : []),
        ...(getNthSunday(y, 7, 2) ? [{ date: getNthSunday(y, 7, 2), name: 'Dia dos Pais' }] : []),
    ];

    return [...fixed, ...getMovableHolidays(y), ...special]
        .filter(h => h.date !== '')
        .sort((a, b) => a.date.localeCompare(b.date));
};
