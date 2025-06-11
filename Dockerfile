# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy only the package.json and package-lock.json to leverage Docker's caching
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the project files into the container
COPY . .

# Expose the application's port
EXPOSE 8099

# Define the command to run your application
CMD ["npm", "run", "dev"]