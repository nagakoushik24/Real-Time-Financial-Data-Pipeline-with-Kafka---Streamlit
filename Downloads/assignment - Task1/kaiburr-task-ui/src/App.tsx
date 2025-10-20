import { DeleteOutlined, ExclamationCircleOutlined, EyeOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Collapse, Empty, Form, Input, Layout, message, Modal, Row, Space, Spin, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import * as api from './api';
import './App.css';
import type { Task } from './types';

const { Text } = Typography;

const { Header, Content } = Layout;
const { Panel } = Collapse;

const App: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [form] = Form.useForm();
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [executingTasks, setExecutingTasks] = useState<Set<string>>(new Set());

    const fetchTasks = async (query = '') => {
        setLoading(true);
        setError(null);
        try {
            const res = query ? await api.findTasksByName(query) : await api.getTasks();
            setTasks(res.data);
            setSearchQuery(query);
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to fetch tasks. Ensure backend is running.';
            setError(errorMsg);
            message.error(errorMsg);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleSearch = (value: string) => fetchTasks(value);
    const handleCreate = () => { form.resetFields(); setIsModalVisible(true); };

    const handleDelete = (id: string, taskName: string) => {
        Modal.confirm({
            title: 'Delete Task',
            content: `Are you sure you want to delete "${taskName}"? This action cannot be undone.`,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            icon: <ExclamationCircleOutlined />,
            onOk: async () => {
                try {
                    await api.deleteTask(id);
                    message.success('Task deleted successfully');
                    fetchTasks(searchQuery);
                } catch (err: any) {
                    message.error(err.message || 'Failed to delete task');
                }
            },
        });
    };

    const handleRun = async (id: string, taskName: string) => {
        setExecutingTasks(prev => new Set(prev).add(id));
        message.loading({ content: `Executing "${taskName}"...`, key: 'run' });
        try {
            await api.executeTask(id);
            message.success({ content: `"${taskName}" executed successfully!`, key: 'run', duration: 3 });
            fetchTasks(searchQuery);
        } catch (err: any) {
            message.error({ content: err.message || 'Execution failed', key: 'run' });
        } finally {
            setExecutingTasks(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleFormSubmit = async (values: Task) => {
        try {
            await api.createTask(values);
            message.success('Task created successfully');
            setIsModalVisible(false);
            fetchTasks(searchQuery);
        } catch (err: any) {
            message.error(err.message || 'Failed to create task');
        }
    };

    const handleRefresh = () => {
        fetchTasks(searchQuery);
    };

    const columns = [
        { 
            title: 'ID', 
            dataIndex: 'id', 
            key: 'id', 
            width: 150,
            ellipsis: { showTitle: false },
            render: (id: string) => <Text code>{id}</Text>
        },
        { 
            title: 'Name', 
            dataIndex: 'name', 
            key: 'name',
            ellipsis: { showTitle: false },
            render: (name: string) => <Text strong>{name}</Text>
        },
        { 
            title: 'Owner', 
            dataIndex: 'owner', 
            key: 'owner',
            ellipsis: { showTitle: false }
        },
        { 
            title: 'Command', 
            dataIndex: 'command', 
            key: 'command',
            ellipsis: { showTitle: false },
            render: (cmd: string) => <Tag color="blue" style={{ maxWidth: 200 }}>{cmd}</Tag>
        },
        {
            title: 'Executions',
            key: 'executions',
            width: 100,
            align: 'center' as const,
            render: (_: any, record: Task) => (
                <Statistic 
                    value={record.taskExecutions?.length || 0} 
                    valueStyle={{ fontSize: '14px' }}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: Task) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button 
                            icon={<EyeOutlined />} 
                            onClick={() => { setSelectedTask(record); setIsDetailsVisible(true); }}
                            aria-label={`View details for ${record.name}`}
                        />
                    </Tooltip>
                    <Tooltip title="Run Task">
                        <Button 
                            icon={<PlayCircleOutlined />} 
                            onClick={() => handleRun(record.id, record.name)}
                            loading={executingTasks.has(record.id)}
                            disabled={executingTasks.has(record.id)}
                            aria-label={`Run task ${record.name}`}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Task">
                        <Button 
                            icon={<DeleteOutlined />} 
                            danger 
                            onClick={() => handleDelete(record.id, record.name)}
                            aria-label={`Delete task ${record.name}`}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Layout className="layout">
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="logo">Kaiburr Task Management</div>
                <Space>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={handleRefresh}
                        aria-label="Refresh tasks"
                    >
                        Refresh
                    </Button>
                </Space>
            </Header>
            <Content style={{ padding: '24px' }}>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={8}>
                        <Card>
                            <Statistic 
                                title="Total Tasks" 
                                value={tasks.length} 
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card>
                            <Statistic 
                                title="Executing" 
                                value={executingTasks.size} 
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card>
                            <Statistic 
                                title="Total Executions" 
                                value={tasks.reduce((sum, task) => sum + (task.taskExecutions?.length || 0), 0)} 
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {error && (
                    <Alert
                        message="Connection Error"
                        description={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setError(null)}
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Card>
                    <div className="toolbar">
                        <Space size="middle" wrap>
                            <Input.Search 
                                placeholder="Search tasks by name..." 
                                onSearch={handleSearch} 
                                enterButton={<SearchOutlined />} 
                                style={{ width: 300 }}
                                allowClear
                                aria-label="Search tasks"
                            />
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={handleCreate}
                                aria-label="Create new task"
                            >
                                Create Task
                            </Button>
                        </Space>
                    </div>
                    
                    <Spin spinning={loading} tip="Loading tasks...">
                        <Table 
                            columns={columns} 
                            dataSource={tasks} 
                            rowKey="id"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tasks`,
                            }}
                            locale={{ 
                                emptyText: <Empty description="No tasks found" /> 
                            }}
                            scroll={{ x: 800 }}
                        />
                    </Spin>
                </Card>
            </Content>

            {/* Create Task Modal */}
            <Modal 
                title="Create New Task" 
                open={isModalVisible} 
                onCancel={() => setIsModalVisible(false)} 
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={handleFormSubmit}
                    autoComplete="off"
                >
                    <Form.Item 
                        name="id" 
                        label="Task ID" 
                        rules={[
                            { required: true, message: 'Please enter a task ID' },
                            { min: 1, message: 'Task ID must be at least 1 character' }
                        ]}
                    >
                        <Input placeholder="Enter unique task ID" />
                    </Form.Item>
                    <Form.Item 
                        name="name" 
                        label="Task Name" 
                        rules={[
                            { required: true, message: 'Please enter a task name' },
                            { min: 1, message: 'Task name must be at least 1 character' }
                        ]}
                    >
                        <Input placeholder="Enter task name" />
                    </Form.Item>
                    <Form.Item 
                        name="owner" 
                        label="Owner" 
                        rules={[
                            { required: true, message: 'Please enter an owner' },
                            { min: 1, message: 'Owner must be at least 1 character' }
                        ]}
                    >
                        <Input placeholder="Enter owner name" />
                    </Form.Item>
                    <Form.Item 
                        name="command" 
                        label="Command" 
                        rules={[
                            { required: true, message: 'Please enter a command' },
                            { min: 1, message: 'Command must be at least 1 character' }
                        ]}
                    >
                        <Input.TextArea 
                            placeholder="Enter shell command (e.g., echo Hello World)" 
                            rows={3}
                        />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Create Task
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Task Details Modal */}
            <Modal 
                title={`Task Details: ${selectedTask?.name || ''}`} 
                open={isDetailsVisible} 
                onCancel={() => setIsDetailsVisible(false)} 
                footer={null}
                width={800}
                destroyOnClose
            >
                {selectedTask ? (
                    <div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <Card size="small">
                                    <Statistic title="Task ID" value={selectedTask.id} valueStyle={{ fontSize: '16px' }} />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small">
                                    <Statistic title="Owner" value={selectedTask.owner} valueStyle={{ fontSize: '16px' }} />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small">
                                    <Statistic 
                                        title="Executions" 
                                        value={selectedTask.taskExecutions?.length || 0} 
                                        valueStyle={{ fontSize: '16px' }} 
                                    />
                                </Card>
                            </Col>
                        </Row>
                        
                        <Card title="Command" size="small" style={{ marginBottom: 16 }}>
                            <Text code style={{ fontSize: '14px' }}>{selectedTask.command}</Text>
                        </Card>

                        <Card title="Execution History" size="small">
                            {selectedTask.taskExecutions?.length ? (
                                <Collapse accordion>
                                    {selectedTask.taskExecutions.map((exec, i) => (
                                        <Panel 
                                            header={`Execution ${i + 1} - ${exec.startTime ? new Date(exec.startTime).toLocaleString() : 'Unknown Time'}`} 
                                            key={i}
                                        >
                                            <Row gutter={[16, 8]}>
                                                <Col span={8}>
                                                    <Text strong>Start Time:</Text><br />
                                                    <Text>{exec.startTime ? new Date(exec.startTime).toLocaleString() : 'N/A'}</Text>
                                                </Col>
                                                <Col span={8}>
                                                    <Text strong>End Time:</Text><br />
                                                    <Text>{exec.endTime ? new Date(exec.endTime).toLocaleString() : 'N/A'}</Text>
                                                </Col>
                                                <Col span={8}>
                                                    <Text strong>Duration:</Text><br />
                                                    <Text style={{ color: '#52c41a' }}>
                                                        {exec.startTime && exec.endTime 
                                                            ? `${Math.round((new Date(exec.endTime).getTime() - new Date(exec.startTime).getTime()) / 1000 * 100) / 100}s`
                                                            : 'N/A'
                                                        }
                                                    </Text>
                                                </Col>
                                            </Row>
                                            <div style={{ marginTop: 16 }}>
                                                <Text strong>Output:</Text>
                                                <pre style={{ 
                                                    background: '#f5f5f5', 
                                                    padding: '12px', 
                                                    borderRadius: '4px',
                                                    marginTop: '8px',
                                                    maxHeight: '300px',
                                                    overflow: 'auto',
                                                    fontSize: '12px'
                                                }}>
                                                    {exec.output}
                                                </pre>
                                            </div>
                                        </Panel>
                                    ))}
                                </Collapse>
                            ) : (
                                <Empty description="No execution history" />
                            )}
                        </Card>
                    </div>
                ) : null}
            </Modal>
        </Layout>
    );
};

export default App;
