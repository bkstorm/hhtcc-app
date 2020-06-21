package com.bkstorm.mb.strategies;

import com.bkstorm.mb.TemplateType;

public class StrategyFactory {
    public static Strategy getStrategy(TemplateType type) {
        Strategy strategy;
        switch (type) {
            case TEMPLATE_08:
                System.out.println("TEMPLATE 08");
                strategy = new Template08Strategy();
                break;
            case TEMPLATE_12:
                System.out.println("TEMPLATE 12");
                strategy = new Template12Strategy();
                break;
            default:
                strategy = new Template08Strategy();
                break;
        }
        return strategy;
    }
}