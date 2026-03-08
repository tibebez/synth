import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartProps {
    title: string;
    type: "bar" | "line" | "pie" | "area";
    data: any[];
    xAxis: string;
    yAxis: string;
}

export function GenUIChart({ title, data, xAxis, yAxis }: ChartProps) {
    const maxVal = Math.max(...data.map((d) => Number(d[yAxis]) || 0), 1);

    return (
        <Card className="rounded-2xl border-none shadow-lg bg-card overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="h-40 flex items-end space-x-2 px-1">
                    {data.map((item, i) => {
                        const height = `${((Number(item[yAxis]) || 0) / maxVal) * 100}%`;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                <div
                                    className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-lg transition-all duration-300 relative"
                                    style={{ height }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item[yAxis]}
                                    </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">
                                    {item[xAxis]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
