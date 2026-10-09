package id.bedebest.bedebest

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetPlugin

class BeDeBestWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (id in appWidgetIds) {
            val data = HomeWidgetPlugin.getData(context)
            val judul = data.getString("judul", "BeDeBest") ?: "BeDeBest"
            val baris = data.getString("baris", "Buka app untuk sinkron jadwal.") ?: "Buka app untuk sinkron jadwal."
            val views = RemoteViews(context.packageName, R.layout.widget_bedebest).apply {
                setTextViewText(R.id.widget_judul, judul)
                setTextViewText(R.id.widget_baris, baris)
            }
            appWidgetManager.updateAppWidget(id, views)
        }
    }
}
