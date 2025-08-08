# STAK-XTRACT

STAK-XTRACT is an AI-powered audio sample extraction and arrangement tool designed for music producers, beatmakers, and audio enthusiasts. It uses advanced machine learning algorithms to intelligently identify and separate audio tracks, allowing users to extract samples and create new arrangements.

## Features

-   **AI-Powered Source Separation**: Automatically separate audio tracks into vocals, bass, drums, and other stems using Demucs.
-   **Interactive Waveform Display**: View the waveforms of all separated tracks, with controls for muting and zooming.
-   **User Authentication**: Secure user accounts and session management.
-   **Cross-Platform**: Ready to be packaged as a desktop application with Electron and a mobile application with Capacitor.
-   **Modern Tech Stack**: Built with TypeScript, React, Node.js, and a PostgreSQL database.

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need the following software installed on your machine:

-   [Node.js](https://nodejs.org/) (v20 or later)
-   [npm](https://www.npmjs.com/) (v10 or later)
-   [Docker](https://www.docker.com/) (for running the AI processing)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install the dependencies:**
    ```sh
    npm install
    ```

### Environment Setup

1.  **Create a `.env` file:**
    Create a new file named `.env` in the root of the project by copying the example file:
    ```sh
    cp .env.example .env
    ```

2.  **Set up the database:**
    -   Create a new PostgreSQL database. A free-tier provider like [Neon](https://neon.tech/) is recommended.
    -   Get the connection string (`DATABASE_URL`) for your new database.
    -   Open the `.env` file and replace the placeholder `DATABASE_URL` with your real connection string.

3.  **Set the session secret:**
    -   Generate a new session secret by running the following command in your terminal:
        ```sh
        node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
        ```
    -   Copy the generated secret and replace the placeholder `SESSION_SECRET` in your `.env` file.

### Database Migration

Once you have set up your environment variables, you need to apply the database schema to your new database.

Run the following command:
```sh
npm run db:push
```
This will create all the necessary tables in your database.

### Running the Application

Now you are ready to run the application.

1.  **Build the AI processor Docker image:**
    The application will automatically build the Docker image for the AI processor on the first run. Make sure Docker is running on your machine.

2.  **Start the development server:**
    ```sh
    npm run dev
    ```
    This will start the backend server and the frontend development server. The application will be available at `http://localhost:5000`.

## Technology Stack

-   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Radix UI
-   **Backend**: Node.js, Express, TypeScript
-   **Database**: PostgreSQL, Drizzle ORM
-   **AI**: Demucs (via Python and Docker)
-   **Authentication**: Passport.js
-   **Cross-Platform**: Electron, Capacitor
