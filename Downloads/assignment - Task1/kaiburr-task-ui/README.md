# Kaiburr Task Management UI

A modern React 19 + TypeScript + Ant Design frontend for the Kaiburr Task Management API.

## Features

- ✅ **Task Management**: Create, view, search, and delete tasks
- ✅ **Command Execution**: Run shell commands and view output
- ✅ **Execution History**: Track all command executions with timestamps
- ✅ **Real-time Updates**: Live statistics and execution status
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- ✅ **Error Handling**: Comprehensive error messages and loading states

## Prerequisites

- Node.js 18+ 
- Backend API running on `http://localhost:8080`

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend connects to the backend API at `http://localhost:8080/tasks` with the following endpoints:

- `GET /tasks` - List all tasks
- `GET /tasks?id={id}` - Get task by ID
- `GET /tasks/findByName?name={name}` - Search tasks by name
- `PUT /tasks` - Create new task
- `DELETE /tasks?id={id}` - Delete task
- `PUT /tasks/execute?taskId={id}` - Execute task

## UI Components

### Dashboard
- **Statistics Cards**: Total tasks, currently executing, total executions
- **Search Bar**: Find tasks by name with real-time filtering
- **Action Buttons**: Create new task, refresh data

### Task Table
- **Responsive Columns**: ID, Name, Owner, Command, Executions, Actions
- **Action Buttons**: View details, run task, delete task
- **Pagination**: Navigate through large task lists
- **Loading States**: Visual feedback during operations

### Task Details Modal
- **Task Information**: ID, Owner, Command display
- **Execution History**: Collapsible list of all executions
- **Command Output**: Scrollable, syntax-highlighted output display

### Create Task Modal
- **Form Validation**: Required fields with helpful error messages
- **Command Input**: Multi-line textarea for shell commands
- **Accessibility**: Proper labels and ARIA attributes

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: WCAG compliant color schemes
- **Responsive Text**: Scalable fonts and proper spacing

## Error Handling

- **Connection Errors**: Clear messages when backend is unavailable
- **Validation Errors**: Field-specific error messages
- **Execution Errors**: Detailed error information for failed commands
- **Timeout Handling**: 10-second timeout for API requests

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

The project uses:
- **React 19** with TypeScript
- **Ant Design 5** for UI components
- **Vite** for build tooling
- **ESLint** for code quality

## Troubleshooting

**Backend Connection Issues:**
- Ensure the Spring Boot backend is running on port 8080
- Check that MongoDB is running and accessible
- Verify CORS settings if running on different ports

**Build Issues:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

**Performance:**
- Large task lists are paginated for better performance
- Command output is limited to 300px height with scrolling
- Images and assets are optimized for fast loading