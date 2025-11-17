'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Renders a chart based on structured JSON data from the agent.
 * @param {{chartJson: {type: string, dataKeyX: string, dataKeysY: string[], data: any[]}}} props
 */
export const ChartRenderer = ({ chartJson }) => {
    if (!chartJson || !chartJson.data || chartJson.data.length === 0) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Chart Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">
                        Could not render chart: Data is missing or invalid.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { type, dataKeyX, dataKeysY, data } = chartJson;

    // Color palette for the lines/bars
    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"]; 
    
    // Choose the Chart Component dynamically
    const ChartComponent = type === 'LineChart' ? LineChart : BarChart;
    const DataComponent = type === 'LineChart' ? Line : Bar;

    return (
        <Card className="mt-4 shadow-lg border-primary/20">
            <CardHeader>
                <CardTitle className="text-lg">Data Visualization</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ChartComponent
                            data={data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey={dataKeyX} stroke="hsl(var(--foreground))" />
                            <YAxis stroke="hsl(var(--foreground))" />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--background))', 
                                    border: '1px solid hsl(var(--border))', 
                                    borderRadius: '0.5rem' 
                                }}
                            />
                            <Legend />
                            {dataKeysY.map((key, index) => (
                                <DataComponent 
                                    key={key} 
                                    dataKey={key} 
                                    fill={colors[index % colors.length]} 
                                    stroke={colors[index % colors.length]}
                                    type="monotone" // Only used for LineChart, ignored by Bar
                                />
                            ))}
                        </ChartComponent>
                    </ResponsiveContainer>
                </div>
                <p className="mt-2 text-sm text-muted-foreground text-center">
                    Chart rendered using key: **{dataKeyX}** and values: **{dataKeysY.join(', ')}**
                </p>
            </CardContent>
        </Card>
    );
};