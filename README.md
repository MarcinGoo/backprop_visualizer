# Backprop Visualizer

An educational application designed to visualize Forward Pass and Backward Pass (Chain Rule) operations within computational graphs (neural networks).

The project was built using React, TypeScript, and Vite. It utilizes the KaTeX library for professional mathematical formula rendering and React Flow for interactive graph visualizations.

## How to run the project locally

> [!IMPORTANT]
> **Node.js Requirement:** This project uses Vite 8 and modern JavaScript features, which require **Node.js version 20 or higher**. If you are on an older version of Node (like v12 which is often the default in Ubuntu/WSL `apt` repositories), the application will crash during startup with a `SyntaxError: Unexpected token '.'`.
> 
> **How to install Node 20 via NVM (Linux/Mac/WSL):**
> ```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
> source ~/.bashrc
> nvm install 20
> ```

### Step 1: Clone the repository
Clone the repository to your local machine using Git:
```bash
git clone https://github.com/MarcinGoo/backprop_visualizer.git
cd backprop_visualizer
```

### Step 2: Install dependencies
Install all required packages using NPM:
```bash
npm install
```

### Step 3: Start the development server
Run the application in development mode:
```bash
npm run dev
```
By default, the application will be accessible at: http://localhost:5173.


