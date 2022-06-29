import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4theme from "@amcharts/amcharts4/themes/amcharts";
import React, {useEffect, useState} from "react";
import {ClockHand} from "@amcharts/amcharts4/charts";
import {color} from "@amcharts/amcharts4/core";


am4core.useTheme(am4theme);


export interface AngleIndicatorProps {
    id: string
    value: number
    min: number
    max: number
}

export const AngleIndicator:React.FC<AngleIndicatorProps> = ({id, value, min, max}) => {
    const [hand, setHand] = useState<ClockHand>();

    hand && hand.showValue(value);

    useEffect(() => {
        let chart = am4core.create(id, am4charts.GaugeChart);
//        chart.innerRadius = -250;
        const axis = chart.xAxes.push(new am4charts.ValueAxis<am4charts.AxisRendererCircular>());
        axis.min = min;
        axis.max = max;
        axis.strictMinMax = true;
        axis.renderer.grid.template.disabled = true;
        axis.renderer.labels.template.disabled = true;

        var range0 = axis.axisRanges.create();
        range0.value = 0;
        range0.endValue = max/2;
        range0.axisFill.fillOpacity = 1;
        range0.axisFill.fill = color('red');
        range0.axisFill.zIndex = -1;

        var range1 = axis.axisRanges.create();
        range1.value = max/2;
        range1.endValue = max;
        range1.axisFill.fillOpacity = 1;
        range1.axisFill.fill = color('green');
        range1.axisFill.zIndex = -1;

        var hand = chart.hands.push(new am4charts.ClockHand());

        hand.fill = am4core.color("#000");
        hand.stroke = am4core.color("#000");
        hand.endWidth = 1;
        hand.startWidth = 10;
        hand.radius = am4core.percent(70);
        hand.showValue(value);
        setHand(hand);

        chart.paddingBottom = 0;
        chart.paddingTop = 0;
        chart.marginBottom = 0;


        return () => {
            if (chart) {
                chart.dispose();
            }
        };
    }, []);

    return(
            <div id={id} style={{ height: "100%" }}/>
    );
}

const calcRudderAngle = (value: number) => {
    const center = 1024 / 2;
    const degrees = 1024 / 2 / 42;
    return value > center ? (value - center) / degrees : (center - value) / degrees * -1;
};


