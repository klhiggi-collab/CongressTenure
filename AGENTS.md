# Project Guidelines: Congress Tenure Tracker

## Core Purpose
Since there are no term limits in Congress, this site is to help users see the length of service of all serving members and simulate the impact of potential term limit proposals.

## Design Philosophy
- **Data-First**: Prioritize the visibility of legislator data over decorative elements.
- **High Density**: Use compact layouts (especially for party comparisons) to show as much information as possible without overwhelming the user.
- **Simulation-Driven**: The "Tenure Simulator" is a primary interactive tool, highlighted with distinct shading and borders.
- **Mobile-Optimized**: Filters and cards must remain functional and readable on smaller screens.

## Key Features
- **Tenure Simulator**: Range slider (2-36 years) that dynamically updates the "Exceeded" and "Approaching" status of all members.
- **Party Comparison**: Side-by-side columns for Democrats, Republicans, and Independents.
- **Vacancy Audit**: Tracking and display of vacant seats.
- **Voter Guides**: Placeholders for future voter guide integration for vacant seats.

## Technical Constraints
- **Performance**: Use `useMemo` for all filtering and status calculations to ensure smooth interaction with the 535+ member dataset.
- **Data Source**: Official United States Project (theunitedstates.io).
