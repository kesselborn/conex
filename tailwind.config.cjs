const colors = require('tailwindcss/colors');

module.exports = {
    mode: 'jit',
    purge: ['./*.html', './conex.css'],
    darkMode: 'media',
    theme: {
        colors:{
            white: colors.white,
            black: colors.black,
            gray: colors.trueGray,
            blue: colors.blue,
            red: colors.red,
            pink: colors.pink,
            yellow: colors.yellow,
            green: colors.green,
            orange: colors.orange,
            purple: colors.purple,
        }
    }
}