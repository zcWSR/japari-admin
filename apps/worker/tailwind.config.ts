import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class", "class"],
	content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			colors: {
				background: "oklch(var(--background))",
				foreground: "oklch(var(--foreground))",
				card: {
					DEFAULT: "oklch(var(--card))",
					foreground: "oklch(var(--card-foreground))",
				},
				popover: {
					DEFAULT: "oklch(var(--popover))",
					foreground: "oklch(var(--popover-foreground))",
				},
				primary: {
					DEFAULT: "oklch(var(--primary))",
					foreground: "oklch(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "oklch(var(--secondary))",
					foreground: "oklch(var(--secondary-foreground))",
				},
				muted: {
					DEFAULT: "oklch(var(--muted))",
					foreground: "oklch(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "oklch(var(--accent))",
					foreground: "oklch(var(--accent-foreground))",
				},
				destructive: {
					DEFAULT: "oklch(var(--destructive))",
					foreground: "oklch(var(--destructive-foreground))",
				},
				border: "oklch(var(--border))",
				input: "oklch(var(--input))",
				ring: "oklch(var(--ring))",
				sidebar: {
					DEFAULT: "oklch(var(--sidebar))",
					foreground: "oklch(var(--sidebar-foreground))",
					primary: "oklch(var(--sidebar-primary))",
					"primary-foreground": "oklch(var(--sidebar-primary-foreground))",
					accent: "oklch(var(--sidebar-accent))",
					"accent-foreground": "oklch(var(--sidebar-accent-foreground))",
					border: "oklch(var(--sidebar-border))",
					ring: "oklch(var(--sidebar-ring))",
				},
				chart: {
					"1": "oklch(var(--chart-1))",
					"2": "oklch(var(--chart-2))",
					"3": "oklch(var(--chart-3))",
					"4": "oklch(var(--chart-4))",
					"5": "oklch(var(--chart-5))",
				},
			},
		},
	},
	plugins: [],
};

export default config;
